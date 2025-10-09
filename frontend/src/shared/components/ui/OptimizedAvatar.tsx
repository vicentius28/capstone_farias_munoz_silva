import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { User as HeroUser } from '@heroui/user';
import { UserIcon } from 'lucide-react';
import { Skeleton } from '@heroui/skeleton';

// Tipos más específicos y constantes
type AvatarSize = 'sm' | 'md' | 'lg';
type AvatarRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
type AvatarColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

interface OptimizedAvatarProps {
  src?: string | null;
  name: string;
  description?: React.ReactNode;
  size?: AvatarSize;
  radius?: AvatarRadius;
  className?: string;
  showFallback?: boolean;
  color?: AvatarColor;
  onImageLoad?: () => void;
  onImageError?: (error: Error) => void;
}
const OptimizedAvatar = memo<OptimizedAvatarProps>(function OptimizedAvatar({
  src,
  name,
  description,
  size = 'md',
  radius = 'lg',
  className = '',
  showFallback = true,
  color = 'default',
  onImageLoad,
  onImageError
}) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Validar y normalizar la URL - SIMPLIFICADO
  const normalizedSrc = useMemo(() => {
    if (!src || typeof src !== 'string') {
      console.log('OptimizedAvatar: No src provided or invalid type:', src);
      return undefined;
    }

    const trimmedSrc = src.trim();
    if (!trimmedSrc) {
      console.log('OptimizedAvatar: Empty src after trim');
      return undefined;
    }

    console.log('OptimizedAvatar: Using normalized src:', trimmedSrc);
    return trimmedSrc;
  }, [src]);

  // Manejar errores de imagen
  const handleImageError = useCallback(() => {
    console.warn(`OptimizedAvatar: Image failed to load: ${normalizedSrc}`);
    setImageError(true);
    setImageSrc(undefined);
    setIsImageLoading(false);

    const error = new Error(`Failed to load image: ${normalizedSrc || 'unknown'}`);
    onImageError?.(error);
  }, [normalizedSrc, onImageError]);

  // Manejar carga exitosa
  const handleImageLoad = useCallback(() => {
    console.log('OptimizedAvatar: Image loaded successfully:', normalizedSrc);
    setImageError(false);
    setIsImageLoading(false);
    onImageLoad?.();
  }, [normalizedSrc, onImageLoad]);

  // Efecto para cargar imagen - SIMPLIFICADO
  useEffect(() => {
    // Reset estados
    setImageError(false);
    setIsImageLoading(false);
    setImageSrc(undefined);

    if (!normalizedSrc) {
      console.log('OptimizedAvatar: No normalized src, showing fallback');
      setImageError(true);
      return;
    }

    console.log('OptimizedAvatar: Starting image load for:', normalizedSrc);
    setIsImageLoading(true);

    // Crear imagen para probar carga - SIN crossOrigin para evitar CORS
    const img = new Image();

    img.onload = () => {
      console.log('OptimizedAvatar: Image onload triggered for:', normalizedSrc);
      setImageSrc(normalizedSrc);
      handleImageLoad();
    };

    img.onerror = (event) => {
      console.error('OptimizedAvatar: Image onerror triggered for:', normalizedSrc, event);
      handleImageError();
    };

    // Timeout para evitar cargas infinitas
    const timeoutId = setTimeout(() => {
      console.warn('OptimizedAvatar: Image load timeout for:', normalizedSrc);
      handleImageError();
    }, 10000);

    img.src = normalizedSrc;

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [normalizedSrc, handleImageError, handleImageLoad]);

  // Props del avatar
  const avatarProps = useMemo(() => ({
    showFallback: showFallback,
    radius,
    size,
    src: imageError ? undefined : imageSrc,
    color,
    icon: <UserIcon className="text-default-500" />,
    className
  }), [showFallback, imageError, radius, size, imageSrc, color, className]);

  // Mostrar skeleton mientras carga
  if (isImageLoading) {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };

    return (
      <div className="flex items-center gap-3" role="status" aria-label="Cargando avatar">
        <Skeleton className={`rounded-${radius} ${sizeClasses[size]}`} />
        {(name || description) && (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-32 rounded" />
            {description && <Skeleton className="h-3 w-24 rounded" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <HeroUser
      avatarProps={avatarProps}
      description={description}
      name={name}
    />
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
export type { OptimizedAvatarProps, AvatarSize, AvatarRadius, AvatarColor };