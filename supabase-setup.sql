-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('seller', 'buyer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'online')),
  qr_code_url TEXT,
  phone_number TEXT NOT NULL,
  seller_image_url TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name) VALUES ('book-images', 'Book Images');
INSERT INTO storage.buckets (id, name) VALUES ('qr-codes', 'QR Codes');
INSERT INTO storage.buckets (id, name) VALUES ('seller-images', 'Seller Images');

-- Set up storage policies
CREATE POLICY "Public Access to Book Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-images');

CREATE POLICY "Public Access to QR Codes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes');

CREATE POLICY "Public Access to Seller Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'seller-images');

CREATE POLICY "Authenticated Users Can Upload Book Images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'book-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Users Can Upload QR Codes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Users Can Upload Seller Images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'seller-images' AND auth.role() = 'authenticated');

-- Set up RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Users can read all users
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  USING (true);

-- Users can update their own user data
CREATE POLICY "Users can update their own user data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can read all books
CREATE POLICY "Users can read all books"
  ON books FOR SELECT
  USING (true);

-- Sellers can insert their own books
CREATE POLICY "Sellers can insert their own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own books
CREATE POLICY "Sellers can update their own books"
  ON books FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can delete their own books
CREATE POLICY "Sellers can delete their own books"
  ON books FOR DELETE
  USING (auth.uid() = seller_id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_type)
  VALUES (new.id, '', new.email, 'buyer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

