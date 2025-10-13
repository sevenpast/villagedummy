'use client'

export function VillageLogo({ size = 'large' }: { size?: 'small' | 'large' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Village Starburst Logo without V */}
      <div className="w-full h-full bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
        <div className="w-3/4 h-3/4 bg-white rounded-full flex items-center justify-center">
          <span className="text-orange-500 font-bold text-lg">🏘️</span>
        </div>
      </div>
      
      {/* Starburst effect */}
      <div className="absolute inset-0 animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-full opacity-30 blur-sm"></div>
      </div>
    </div>
  )
}
