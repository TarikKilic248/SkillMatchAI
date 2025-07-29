# Authentication API Test Examples

## 1. User Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "message": "Kullanıcı başarıyla oluşturuldu",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User"
  }
}
```

## 2. User Signin

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Expected Response:**
```json
{
  "message": "Giriş başarılı",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User"
  },
  "session": {
    "access_token": "token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

## 3. Get Current User

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## 4. User Signout

```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Başarıyla çıkış yapıldı"
}
```

## Error Responses

### Invalid Email
```json
{
  "error": "Geçersiz veri formatı",
  "details": [
    {
      "code": "invalid_string",
      "validation": "email",
      "message": "Geçerli bir email adresi giriniz",
      "path": ["email"]
    }
  ]
}
```

### User Already Exists
```json
{
  "error": "Bu email adresi zaten kullanılıyor"
}
```

### Invalid Credentials
```json
{
  "error": "Email veya şifre hatalı"
}
```

### Missing Token
```json
{
  "error": "Yetkilendirme token'ı gerekli"
}
```

## Environment Variables Required

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Run the SQL script in `scripts/create-all-tables.sql` in your Supabase SQL Editor to create the necessary tables and policies. 