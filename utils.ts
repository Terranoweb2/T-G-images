
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Return only the base64 part, without the data URL prefix
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const applyMirror = (base64Image: string, mimeType: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `data:${mimeType};base64,${base64Image}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject('Could not get canvas context');
            }
            // Flip the context horizontally
            ctx.translate(img.width, 0);
            ctx.scale(-1, 1);
            // Draw the image
            ctx.drawImage(img, 0, 0);
            // Get the mirrored image as a data URL and extract base64
            resolve(canvas.toDataURL(mimeType).split(',')[1]);
        };
        img.onerror = (error) => reject(error);
    });
};

export const mergeAudioAndVideo = (videoUrl: string, audioUrl: string, volume: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.muted = true; // The video's own audio track is not needed

            const audioContext = new AudioContext();
            const audio = document.createElement('audio');
            audio.src = audioUrl;
            audio.crossOrigin = "anonymous";

            await Promise.all([
                new Promise<void>(res => video.onloadedmetadata = () => res()),
                new Promise<void>(res => audio.onloadedmetadata = () => res())
            ]);
            
            video.currentTime = 0;
            audio.currentTime = 0;

            const audioSource = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = volume;
            const destination = audioContext.createMediaStreamDestination();
            
            audioSource.connect(gainNode);
            gainNode.connect(destination);

            const audioTrack = destination.stream.getAudioTracks()[0];
            
            const videoElement = video as any;
            if (!videoElement.captureStream && !videoElement.mozCaptureStream) {
                 return reject(new Error('Your browser does not support captureStream on video elements.'));
            }

            const videoStream = videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
            const videoTrack = videoStream.getVideoTracks()[0];
            
            const combinedStream = new MediaStream([videoTrack, audioTrack]);
            
            const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                audioContext.close().catch(console.error);
                resolve(url);
            };

            recorder.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                audioContext.close().catch(console.error);
                reject(new Error('An error occurred with the MediaRecorder.'));
            };

            video.onended = () => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            };
            
            recorder.start();
            await audio.play();
            await video.play();

        } catch (error) {
            console.error("Error merging audio and video:", error);
            reject(error);
        }
    });
};
