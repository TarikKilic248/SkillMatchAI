import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FiLogIn } from "react-icons/fi"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4 overflow-hidden relative font-inter">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="relative mb-4">
            <FiLogIn className="w-16 h-16 mx-auto text-white animate-float" />
            <div className="absolute inset-0 w-16 h-16 mx-auto bg-white/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Giriş Yap
          </CardTitle>
          <Skeleton className="h-6 w-3/4 mx-auto mt-2 bg-white/20" />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Skeleton className="h-12 w-full bg-white/20" />
          <Skeleton className="h-12 w-full bg-white/20" />
          <Skeleton className="h-12 w-full bg-white/20" />
          <Skeleton className="h-6 w-1/2 mx-auto mt-6 bg-white/20" />
        </CardContent>
      </Card>
    </div>
  )
}
