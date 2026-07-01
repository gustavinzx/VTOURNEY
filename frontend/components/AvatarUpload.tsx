'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

interface AvatarUploadProps {
    currentUrl?: string;
    displayName: string;
    onSuccess: (newUrl: string) => void;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Gera um Blob recortado a partir de uma imagem e das coordenadas do crop.
 * Usa um canvas off-screen — a abordagem padrão para crop de imagens no browser.
 *
 * Por que canvas e não CSS clip?
 * O CSS clip é visual apenas. O canvas produz um arquivo real que pode ser
 * enviado ao servidor, com as dimensões exatas do crop aplicadas.
 */
async function getCroppedBlob(imageSrc: string, cropPixels: CropArea): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    // Exporta sempre em 400×400 para boa resolução no perfil
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0, 0,
        400, 400
    );

    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Canvas vazio')),
            'image/webp',
            0.92 // qualidade 92% — bom equilíbrio tamanho/qualidade
        )
    );
}

export default function AvatarUpload({ currentUrl, displayName, onSuccess }: AvatarUploadProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function getInitials(name: string) {
        if (!name) return '';
        return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Imagem muito grande. Máximo: 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setModalOpen(true);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        };
        reader.readAsDataURL(file);

        // Reset o input para permitir reselecionar o mesmo arquivo
        e.target.value = '';
    }

    const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
        setCroppedAreaPixels(pixels);
    }, []);

    async function handleUpload() {
        if (!imageSrc || !croppedAreaPixels) return;
        setUploading(true);

        try {
            const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);

            const formData = new FormData();
            // O nome do campo deve coincidir com uploadMiddleware.single('avatar') no backend
            formData.append('avatar', blob, 'avatar.webp');

            const { data } = await api.post('/usuarios/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Avatar atualizado!');
            setModalOpen(false);
            setImageSrc(null);
            onSuccess(data.avatar_url);
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    }

    return (
        <>
            {/* Avatar clickável */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {/* Avatar real ou fallback com iniciais */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-zinc-700 group-hover:ring-red-600/60 transition-all">
                    {currentUrl ? (
                        <img src={currentUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-xl font-black text-white">
                            {getInitials(displayName)}
                        </div>
                    )}
                </div>

                {/* Overlay de câmera ao hover */}
                <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-lg">📷</span>
                </div>
            </div>

            {/* Input file oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Modal de crop */}
            <AnimatePresence>
                {modalOpen && imageSrc && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => { setModalOpen(false); setImageSrc(null); }}
                        />

                        <motion.div
                            className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden w-full max-w-md"
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        >
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold text-white">Ajustar avatar</h3>
                                <button
                                    onClick={() => { setModalOpen(false); setImageSrc(null); }}
                                    className="text-zinc-500 hover:text-white text-xl leading-none transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Crop area */}
                            <div className="relative bg-zinc-950" style={{ height: 320 }}>
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"      // preview circular
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    style={{
                                        containerStyle: { background: '#09090b' },
                                        cropAreaStyle: { border: '2px solid #dc2626' },
                                    }}
                                />
                            </div>

                            {/* Zoom slider */}
                            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-zinc-500">🔍</span>
                                    <input
                                        type="range"
                                        min={1} max={3} step={0.05}
                                        value={zoom}
                                        onChange={e => setZoom(Number(e.target.value))}
                                        className="flex-1 accent-red-600"
                                    />
                                    <span className="text-xs text-zinc-500">{zoom.toFixed(1)}×</span>
                                </div>
                            </div>

                            <div className="p-4 flex gap-3">
                                <button
                                    onClick={() => { setModalOpen(false); setImageSrc(null); }}
                                    className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    id="btn-confirmar-avatar"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </span>
                                    ) : 'Salvar avatar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
