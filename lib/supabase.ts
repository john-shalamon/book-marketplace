import { createClient } from "@supabase/supabase-js"

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export type User = {
  id: string
  name: string
  email: string
  user_type: "seller" | "buyer"
  created_at: string
}

export type Book = {
  id: string
  seller_id: string
  title: string
  description?: string
  price: number
  image_url: string
  payment_method: "cash" | "online"
  qr_code_url?: string
  phone_number: string
  seller_image_url: string
  seller_name: string
  created_at: string
}

