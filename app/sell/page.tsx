"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"

export default function SellBook() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [bookImage, setBookImage] = useState<File | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<File | null>(null)
  const [sellerImage, setSellerImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookImagePreview, setBookImagePreview] = useState<string | null>(null)
  const [qrCodeImagePreview, setQrCodeImagePreview] = useState<string | null>(null)
  const [sellerImagePreview, setSellerImagePreview] = useState<string | null>(null)

  const handleBookImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBookImage(file)
      setBookImagePreview(URL.createObjectURL(file))
    }
  }

  const handleQrCodeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setQrCodeImage(file)
      setQrCodeImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSellerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSellerImage(file)
      setSellerImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to sell books")
      return
    }

    if (user.user_type !== "seller") {
      setError("Only sellers can list books")
      return
    }

    if (!bookImage) {
      setError("Book image is required")
      return
    }

    if (paymentMethod === "online" && !qrCodeImage) {
      setError("QR code image is required for online payments")
      return
    }

    if (!sellerImage) {
      setError("Seller image is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Upload book image
      const bookImageName = `${Date.now()}-${bookImage.name}`
      const { error: bookImageError } = await supabase.storage.from("book-images").upload(bookImageName, bookImage)

      if (bookImageError) throw new Error("Error uploading book image")

      const bookImageUrl = supabase.storage.from("book-images").getPublicUrl(bookImageName).data.publicUrl

      // Upload QR code image if payment method is online
      let qrCodeUrl = ""
      if (paymentMethod === "online" && qrCodeImage) {
        const qrCodeImageName = `${Date.now()}-${qrCodeImage.name}`
        const { error: qrCodeImageError } = await supabase.storage.from("qr-codes").upload(qrCodeImageName, qrCodeImage)

        if (qrCodeImageError) throw new Error("Error uploading QR code image")

        qrCodeUrl = supabase.storage.from("qr-codes").getPublicUrl(qrCodeImageName).data.publicUrl
      }

      // Upload seller image
      const sellerImageName = `${Date.now()}-${sellerImage.name}`
      const { error: sellerImageError } = await supabase.storage
        .from("seller-images")
        .upload(sellerImageName, sellerImage)

      if (sellerImageError) throw new Error("Error uploading seller image")

      const sellerImageUrl = supabase.storage.from("seller-images").getPublicUrl(sellerImageName).data.publicUrl

      // Insert book data
      const { error: insertError } = await supabase.from("books").insert([
        {
          seller_id: user.id,
          title,
          description,
          price: Number.parseFloat(price),
          image_url: bookImageUrl,
          payment_method: paymentMethod,
          qr_code_url: qrCodeUrl,
          phone_number: phoneNumber,
          seller_image_url: sellerImageUrl,
          seller_name: user.name,
        },
      ])

      if (insertError) throw new Error("Error adding book to database")

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading your book")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 bg-black p-4 rounded-lg shadow">
            <Button variant="default" className="mb-4 text-black">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Sell Your Book</h1>
            <p className="text-gray-600">Fill out the form below to list your book for sale</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
              <CardDescription>Provide information about the book you want to sell</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter book title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Book Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter book description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="Enter price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookImage">Book Image</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="bookImage"
                      type="file"
                      accept="image/*"
                      onChange={handleBookImageChange}
                      required
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("bookImage")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {bookImage ? "Change Image" : "Upload Image"}
                    </Button>
                    {bookImagePreview && (
                      <div className="relative h-16 w-16 overflow-hidden rounded border">
                        <img
                          src={bookImagePreview || "/placeholder.svg"}
                          alt="Book preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "cash" | "online")}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash">Cash on Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online">Online Payment</Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentMethod === "online" && (
                  <div className="space-y-2">
                    <Label htmlFor="qrCodeImage">QR Code Image</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="qrCodeImage"
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeImageChange}
                        required
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("qrCodeImage")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {qrCodeImage ? "Change QR Code" : "Upload QR Code"}
                      </Button>
                      {qrCodeImagePreview && (
                        <div className="relative h-16 w-16 overflow-hidden rounded border">
                          <img
                            src={qrCodeImagePreview || "/placeholder.svg"}
                            alt="QR Code preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerImage">Your Photo (Passport Size)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="sellerImage"
                      type="file"
                      accept="image/*"
                      onChange={handleSellerImageChange}
                      required
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("sellerImage")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {sellerImage ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {sellerImagePreview && (
                      <div className="relative h-16 w-16 overflow-hidden rounded border">
                        <img
                          src={sellerImagePreview || "/placeholder.svg"}
                          alt="Seller preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Uploading..." : "Upload Book"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

