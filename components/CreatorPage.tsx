import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { User, HistoryItem } from '../types';
import { Page, Plan } from '../types';
import { fileToBase64, applyMirror } from '../utils';
import * as GeminiService from '../services/geminiService';
import * as dbService from '../services/dbService';
import { DownloadIcon, FlipHorizontalIcon, UploadIcon, WandIcon, VideoIcon, TrashIcon, XCircleIcon } from './Icons';

interface CreatorPageProps {
  user: User;
  setUser: (user: User) => void;
  setPage: (page: Page) => void;
  setIsLoading: (loading: boolean, message?: string) => void;
}

const HistoryItemCard: React.FC<{item: HistoryItem, onUse: (item: HistoryItem) => void, onDownload: (item: HistoryItem) => void, onDelete: (id: string) => void}> = ({ item, onUse, onDownload, onDelete }) => {
    const thumbnailUrl = item.generatedMedia.type === 'image' && item.generatedMedia.base64
        ? `data:${item.generatedMedia.mimeType};base64,${item.generatedMedia.base64}`
        : item.sourceImage
        ? `data:${item.sourceImage.mimeType};base64,${item.sourceImage.base64}`
        : null;

    return (
        <div className="bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden flex flex-col hover:border-brand-blue transition-colors duration-300">
            <div className="relative aspect-video bg-gray-700">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="History thumbnail" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <VideoIcon className="w-12 h-12 text-gray-500" />
                    </div>
                )}
                {item.generatedMedia.type === 'video' && (
                     <div className="absolute top-2 left-2 bg-black/50 p-1 rounded-full">
                        <VideoIcon className="w-4 h-4 text-white" />
                     </div>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <p className="text-sm text-gray-300 flex-grow h-14 overflow-hidden" title={item.prompt || "Aucune invite"}>
                    {item.prompt || "Aucune invite"}
                </p>
                <p className="text-xs text-gray-500 mt-2">{new Date(item.timestamp).toLocaleString()}</p>
                <div className="flex space-x-2 mt-3">
                    <button onClick={() => onUse(item)} className="bg-brand-blue hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex-1 transition-colors">
                        Utiliser
                    </button>
                    <button
                        onClick={() => onDownload(item)}
                        disabled={item.generatedMedia.type === 'video'}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold p-2 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        title="Télécharger"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 text-sm font-semibold p-2 rounded-md transition-colors"
                        title="Supprimer"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreatorPage: React.FC<CreatorPageProps> = ({ user, setUser, setPage, setIsLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<{ base64: string; dataUrl: string; file: File } | null>(null);
  const [generatedMedia, setGeneratedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const promptSuggestions = [
      "Transformer en une vidéo épique de 15s",
      "Style cyberpunk avec néons",
      "Rendre l'image plus lumineuse et vibrante",
      "Animation en boucle de 5s",
      "Ajouter une pluie fine et des reflets",
      "Effet de zoom cinématique lent",
  ];

  useEffect(() => {
    const loadHistory = async () => {
        try {
            const userHistory = await dbService.getHistoryForUser(user.email);
            setHistory(userHistory);
        } catch (e) {
            console.error("Failed to load history from IndexedDB", e);
            setError("Impossible de charger l'historique des créations.");
        }
    };
    if (user.email) {
      loadHistory();
    }
  }, [user.email]);
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setSourceImage({ base64, dataUrl: URL.createObjectURL(file), file });
        setGeneratedMedia(null); // Clear previous generation on new upload
        setIsMirrored(false);
      } catch (err) {
        setError('Erreur lors de la lecture du fichier.');
        console.error(err);
      }
    }
  }, []);

  const handleGeneration = async (type: 'image' | 'video') => {
    if (user.plan === Plan.Free && user.generationsLeft <= 0) {
      setPage(Page.Subscription);
      return;
    }
    if (!prompt && !sourceImage) {
        setError("Veuillez entrer une invite ou importer une image.");
        return;
    }
    if(type === 'image' && !sourceImage) {
        setError("Veuillez importer une image pour l'améliorer.");
        return;
    }

    setError('');
    setIsLoading(true, type === 'video' ? 'Génération de la vidéo en cours...' : "Amélioration de l'image en cours...");

    try {
        let imageToSend = sourceImage;
        if(sourceImage && isMirrored) {
            const mirroredBase64 = await applyMirror(sourceImage.base64, sourceImage.file.type);
            imageToSend = { ...sourceImage, base64: mirroredBase64 };
        }
        
        if (type === 'video') {
            const videoUrl = await GeminiService.generateVideo(prompt, imageToSend ? { base64: imageToSend.base64, mimeType: imageToSend.file.type } : undefined);
            setGeneratedMedia({ url: videoUrl, type: 'video' });
            
            const newHistoryItem: HistoryItem = {
                id: `${user.email}-${Date.now()}`, timestamp: Date.now(), prompt,
                sourceImage: imageToSend ? { base64: imageToSend.base64, mimeType: imageToSend.file.type } : undefined,
                generatedMedia: { type: 'video' }
            };
            const updatedHistory = [newHistoryItem, ...history];
            setHistory(updatedHistory);
            dbService.saveHistoryItem(user.email, newHistoryItem).catch(e => {
              console.error("Failed to save history item", e);
            });

        } else if (imageToSend) {
            const result = await GeminiService.editImage(prompt, { base64: imageToSend.base64, mimeType: imageToSend.file.type });
            const newDataUrl = `data:${result.newMimeType};base64,${result.newImageBase64}`;
            setGeneratedMedia({ url: newDataUrl, type: 'image' });

            const newFile = new File([], "generated_image", {type: result.newMimeType});
            setSourceImage({ base64: result.newImageBase64, dataUrl: newDataUrl, file: newFile });
            setIsMirrored(false);

            const newHistoryItem: HistoryItem = {
                id: `${user.email}-${Date.now()}`, timestamp: Date.now(), prompt,
                sourceImage: imageToSend ? { base64: imageToSend.base64, mimeType: imageToSend.file.type } : undefined,
                generatedMedia: {
                    type: 'image', base64: result.newImageBase64, mimeType: result.newMimeType,
                },
            };
            const updatedHistory = [newHistoryItem, ...history];
            setHistory(updatedHistory);
            dbService.saveHistoryItem(user.email, newHistoryItem).catch(e => {
              console.error("Failed to save history item", e);
            });
        }

        const updatedUser = { ...user, generationsLeft: user.generationsLeft - 1 };
        setUser(updatedUser);
        const storedUserRaw = localStorage.getItem('t-glacia-user');
        if (storedUserRaw) {
            const storedUser = JSON.parse(storedUserRaw);
            localStorage.setItem('t-glacia-user', JSON.stringify({ ...storedUser, ...updatedUser }));
        }
    } catch (err) {
        console.error(err);
        setError(`Une erreur est survenue lors de la génération: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleUseHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    
    if (item.sourceImage) {
        const dataUrl = `data:${item.sourceImage.mimeType};base64,${item.sourceImage.base64}`;
        const file = new File([], 'history_source_image', { type: item.sourceImage.mimeType });
        setSourceImage({ base64: item.sourceImage.base64, dataUrl, file });
    } else {
        setSourceImage(null);
    }
    
    if (item.generatedMedia.type === 'image' && item.generatedMedia.base64) {
        setGeneratedMedia({
            url: `data:${item.generatedMedia.mimeType};base64,${item.generatedMedia.base64}`,
            type: 'image'
        });
        const file = new File([], 'history_generated_image', { type: item.generatedMedia.mimeType });
        setSourceImage({ base64: item.generatedMedia.base64, dataUrl: `data:${item.generatedMedia.mimeType};base64,${item.generatedMedia.base64}`, file });
    } else {
        setGeneratedMedia(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadHistoryItem = (item: HistoryItem) => {
      if (item.generatedMedia.type === 'image' && item.generatedMedia.base64 && item.generatedMedia.mimeType) {
          const a = document.createElement('a');
          a.href = `data:${item.generatedMedia.mimeType};base64,${item.generatedMedia.base64}`;
          const extension = item.generatedMedia.mimeType.split('/')[1] || 'png';
          a.download = `t-glacia-creation-${item.id}.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };
  
  const handleDeleteHistoryItem = async (itemId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément de l'historique ? Cette action est irréversible.")) {
        try {
            await dbService.deleteHistoryItem(itemId);
            setHistory(prevHistory => prevHistory.filter(item => item.id !== itemId));
        } catch (e) {
            console.error("Failed to delete history item", e);
            setError("Impossible de supprimer l'élément de l'historique.");
        }
    }
  };

  const handleClearImage = () => {
    setSourceImage(null);
    setGeneratedMedia(null);
    setIsMirrored(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Allows re-uploading the same file
    }
  };

  const currentPreviewUrl = generatedMedia?.url ?? sourceImage?.dataUrl;
  const isVideoPreview = generatedMedia?.type === 'video';

  return (
    <div className="min-h-screen bg-brand-dark text-white pt-20 md:pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6">
        {user.plan === Plan.Free && (
            <div className="bg-brand-blue/10 border border-brand-blue/30 text-center p-4 rounded-xl mb-8">
                <p className="text-brand-light">
                    Vous utilisez le Plan Gratuit. Il vous reste <span className="font-bold text-white">{user.generationsLeft}</span> génération{user.generationsLeft !== 1 ? 's' : ''}.
                </p>
                <button onClick={() => setPage(Page.Subscription)} className="mt-2 text-sm font-bold text-brand-blue hover:underline">
                    Passer à un plan supérieur pour des créations illimitées
                </button>
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: Controls */}
            <div className="flex flex-col space-y-6">
              <div 
                className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-blue transition-colors h-48 flex flex-col justify-center items-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-gray-400">Glissez-déposez ou cliquez pour importer</p>
                <p className="text-xs text-gray-500 mt-1">Images jusqu'à 10MB</p>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez votre vision... ex: 'Transformer en vidéo épique de 15s avec une musique relaxante' ou 'Rendre cette image plus lumineuse avec un style cyberpunk'"
                className="w-full h-32 sm:h-40 p-4 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue transition-shadow"
              />

              <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Besoin d'inspiration ?</h3>
                  <div className="flex flex-wrap gap-2">
                      {promptSuggestions.map((suggestion) => (
                          <button
                              key={suggestion}
                              onClick={() => setPrompt(suggestion)}
                              className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded-full transition-colors"
                          >
                              {suggestion}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <button
                    onClick={() => handleGeneration('image')}
                    disabled={!sourceImage}
                    className="flex items-center justify-center w-full py-3 px-4 bg-brand-purple hover:bg-purple-500 rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:enabled:scale-105"
                >
                    <WandIcon className="w-5 h-5 mr-2" /> Améliorer l'image
                </button>
                <button
                    onClick={() => handleGeneration('video')}
                    className="flex items-center justify-center w-full py-3 px-4 bg-brand-blue hover:bg-blue-500 rounded-lg font-semibold transition-colors transform hover:scale-105"
                >
                    <VideoIcon className="w-5 h-5 mr-2" /> Générer la vidéo
                </button>
              </div>
              {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg">{error}</p>}
            </div>

            {/* Right Panel: Preview */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl flex flex-col p-2 sm:p-4 relative aspect-video">
                {currentPreviewUrl ? (
                    <>
                    {isVideoPreview ? (
                        <video src={currentPreviewUrl} controls autoPlay className="w-full h-full object-contain"></video>
                    ) : (
                        <img src={currentPreviewUrl} alt="Preview" className={`w-full h-full object-contain ${isMirrored ? 'transform scale-x-[-1]' : ''}`} />
                    )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">
                        L'aperçu de votre création apparaîtra ici.
                    </div>
                )}
                
                {sourceImage && (
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center space-x-2">
                        <button
                            onClick={handleClearImage}
                            className={`p-2 rounded-full transition-colors bg-gray-800/50 hover:bg-red-500/50 text-white`}
                            title="Effacer l'image"
                        >
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                        <button
                            onClick={() => setIsMirrored(!isMirrored)}
                            className={`p-2 rounded-full transition-colors ${isMirrored ? 'bg-brand-blue text-white' : 'bg-gray-800/50 hover:bg-gray-700 text-white'}`}
                            title="Miroir"
                        >
                            <FlipHorizontalIcon className="w-5 h-5"/>
                        </button>
                        {generatedMedia && (
                            <a
                                href={generatedMedia.url}
                                download={`t-glacia-creation.${generatedMedia.type === 'video' ? 'mp4' : 'png'}`}
                                className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                                title="Télécharger"
                            >
                                <DownloadIcon className="w-5 h-5"/>
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Historique des créations</h2>
          {history.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {history.map(item => (
                      <HistoryItemCard key={item.id} item={item} onUse={handleUseHistoryItem} onDownload={handleDownloadHistoryItem} onDelete={handleDeleteHistoryItem}/>
                  ))}
              </div>
          ) : (
              <div className="text-center py-12 sm:py-16 bg-gray-900/50 rounded-xl border border-gray-700">
                  <p className="text-gray-500">Aucune création dans votre historique.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default CreatorPage;