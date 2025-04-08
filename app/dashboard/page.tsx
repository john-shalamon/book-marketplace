"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { supabase, type Book } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ProtectedRoute from "@/components/protected-route"
import { LogOut, Plus } from "lucide-react"

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooks() {
      try {
        const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false })

        if (error) throw error
        setBooks(data as Book[])
      } catch (error) {
        console.error("Error fetching books:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow color-black">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-black">BookMarket</h1>
            <div className="flex items-center gap-4">
              {user?.user_type === "seller" && (
                <Button asChild>
                  <Link href="/sell">
                    <Plus className="mr-2 h-4 w-4" />
                    Sell Your Books
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Welcome, {user?.name}!</h2>
            <p className="text-gray-600">
              Browse available books or {user?.user_type === "seller" ? "sell your own" : "find your next read"}.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No books available</h3>
              <p className="mt-1 text-gray-500">
                {user?.user_type === "seller"
                  ? "Start by adding your first book for sale!"
                  : "Check back later for available books."}
              </p>
              {user?.user_type === "seller" && (
                <Button className="mt-4" asChild>
                  <Link href="/sell">
                    <Plus className="mr-2 h-4 w-4" />
                    Sell Your Books
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <Link href={`/book/${book.id}`} key={book.id}>
                  <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                    <div className="relative h-48 w-full">
                      <Image
                        src={book.image_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-500">Seller: {book.seller_name}</p>
                      <p className="font-medium text-lg">${book.price.toFixed(2)}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <p className="text-xs text-gray-500">
                        Payment: {book.payment_method === "cash" ? "Cash on Delivery" : "Online Payment"}
                      </p>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

