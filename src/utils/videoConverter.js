import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let isLoading = false;

/**
 * Initialize FFmpeg instance (lazy loading)
 */
const loadFFmpeg = async (onProgress) => {
  if (ffmpegInstance) return ffmpegInstance;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return ffmpegInstance;
  }

  isLoading = true;
  
  try {
    const ffmpeg = new FFmpeg();
    
    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    // Listen to progress if callback provided
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('Failed to initialize video converter');
  } finally {
    isLoading = false;
  }
};

/**
 * Check if a video needs conversion (is it already H.264+AAC?)
 */
const needsConversion = async (file) => {
  // For now, we'll convert all non-MP4 files and assume MP4 might need it
  // A more sophisticated check would parse the video metadata
  const ext = file.name.split('.').pop().toLowerCase();
  
  // Always convert these formats
  if (['mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(ext)) {
    return true;
  }
  
  // For MP4, we'll assume it might need conversion
  // (proper detection would require parsing codec info)
  return true;
};

/**
 * Convert video to web-compatible format (H.264 + AAC)
 * @param {File} file - The video file to convert
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<File>} - Converted video file
 */
export const convertVideoForWeb = async (file, onProgress) => {
  try {
    // Check if conversion is needed
    const shouldConvert = await needsConversion(file);
    if (!shouldConvert) {
      console.log('Video is already in web format, skipping conversion');
      return file;
    }

    console.log('Starting video conversion for web compatibility...');
    
    // Load FFmpeg
    const ffmpeg = await loadFFmpeg(onProgress);

    // Get file extension
    const inputExt = file.name.split('.').pop();
    const inputName = `input.${inputExt}`;
    const outputName = 'output.mp4';

    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Convert to H.264 + AAC with web optimization
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',      // H.264 video codec
      '-preset', 'medium',     // Encoding speed/quality balance
      '-crf', '23',            // Quality (lower = better, 18-28 is good range)
      '-c:a', 'aac',           // AAC audio codec
      '-b:a', '128k',          // Audio bitrate
      '-movflags', '+faststart', // Enable streaming/progressive playback
      '-pix_fmt', 'yuv420p',   // Pixel format for compatibility
      '-y',                    // Overwrite output
      outputName
    ]);

    // Read converted file
    const data = await ffmpeg.readFile(outputName);
    
    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Create new File object
    const convertedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const convertedFile = new File(
      [convertedBlob],
      file.name.replace(/\.[^.]+$/, '_converted.mp4'),
      { type: 'video/mp4' }
    );

    console.log('Video conversion complete!');
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Converted size: ${(convertedFile.size / 1024 / 1024).toFixed(2)} MB`);

    return convertedFile;
  } catch (error) {
    console.error('Video conversion failed:', error);
    throw new Error(`Video conversion failed: ${error.message}`);
  }
};

/**
 * Validate video file
 */
export const isValidVideoFile = (file) => {
  const validTypes = [
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-matroska', // .mkv
    'video/webm',
  ];
  
  const validExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
  const ext = file.name.split('.').pop().toLowerCase();
  
  return validTypes.includes(file.type) || validExtensions.includes(ext);
};

/**
 * Get video duration
 */
export const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};
