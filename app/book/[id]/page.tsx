"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { supabase, type Book } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, Phone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProtectedRoute from "@/components/protected-route"
import Link from "next/link"

export default function BookDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBook() {
      try {
        const { data, error } = await supabase.from("books").select("*").eq("id", id).single()

        if (error) throw error
        setBook(data as Book)
      } catch (error) {
        console.error("Error fetching book:", error)
        setError("Book not found")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBook()
    }
  }, [id])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !book) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Book not found"}</AlertDescription>
            </Alert>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-lg border">
              <Image src={book.image_url || "/placeholder.svg"} alt={book.title} fill className="object-cover" />
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold">{book.title}</h1>
              <p className="mt-2 text-xl font-semibold text-primary">${book.price.toFixed(2)}</p>

              <div className="mt-4">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="mt-1 text-gray-600">{book.description || "No description provided"}</p>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold">Seller Information</h2>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={book.seller_image_url || "/placeholder.svg"}
                      alt={book.seller_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{book.seller_name}</p>
                    <p className="text-sm text-gray-600">
                      <Phone className="mr-1 inline-block h-3 w-3" />
                      {book.phone_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold">Payment Method</h2>
                <p className="mt-1 text-gray-600">
                  {book.payment_method === "cash" ? "Cash on Delivery" : "Online Payment"}
                </p>

                {book.payment_method === "online" && book.qr_code_url && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium">Payment QR Code</h3>
                    <div className="mt-2 relative h-48 w-48 overflow-hidden rounded-lg border">
                      <Image
                        src={book.qr_code_url || "/placeholder.svg"}
                        alt="Payment QR Code"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {user?.user_type === "buyer" && (
                <div className="mt-auto pt-6">
                  <Button className="w-full" size="lg">
                    Contact Seller
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

