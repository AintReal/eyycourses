# Video Conversion Guide for Web Compatibility

## Problem
Videos play only audio (no picture) on Windows browsers but work fine on Mac. This is caused by incompatible video codecs (usually H.265/HEVC).

## Solution
Re-encode videos to H.264 + AAC format, which is universally supported across all browsers and platforms.

---

## Scripts Provided

### 1. **convert-videos.sh** - Single File Conversion
Converts one video file at a time.

**Usage:**
```bash
./convert-videos.sh input.mp4
# Creates: input_converted.mp4

./convert-videos.sh myvideo.mp4 output.mp4
# Creates: output.mp4
```

### 2. **batch-convert-videos.sh** - Batch Conversion
Converts all videos in a directory at once.

**Usage:**
```bash
# Convert all videos in current directory
./batch-convert-videos.sh

# Convert all videos from specific input directory
./batch-convert-videos.sh /path/to/videos

# Convert and output to specific directory
./batch-convert-videos.sh /path/to/videos /path/to/output
```

---

## Step-by-Step Instructions

### Option A: Convert Single Video
1. Place your video in the project directory (or note its path)
2. Run:
   ```bash
   ./convert-videos.sh path/to/your/video.mp4
   ```
3. Upload the converted video to Supabase storage
4. Update the video URL in your admin dashboard

### Option B: Convert All Videos (Recommended)
1. Put all your course videos in a folder (e.g., `original-videos/`)
2. Run:
   ```bash
   ./batch-convert-videos.sh original-videos/ converted-videos/
   ```
3. Upload all converted videos from `converted-videos/` to Supabase
4. Update video URLs in your admin dashboard

---

## What the Conversion Does

The script converts videos to web-optimized format:
- **Video Codec**: H.264 (libx264) - universally supported
- **Audio Codec**: AAC - web standard
- **Quality**: CRF 23 (high quality, reasonable file size)
- **Optimization**: `+faststart` flag for streaming/progressive playback
- **Pixel Format**: yuv420p (maximum compatibility)

---

## After Conversion

1. **Test locally**: Open the converted video in a browser to confirm it works
2. **Upload to Supabase**: 
   - Go to your Supabase storage bucket `lesson-videos`
   - Upload the converted videos
   - Keep the same file structure/names (or update your database)
3. **Verify on Windows**: Test on a Windows PC to confirm video plays with picture

---

## File Size Note

Converted files may be slightly larger or smaller depending on original encoding. The script balances quality and file size for web delivery.

---

## Need Help?

If you encounter issues:
1. Check that ffmpeg is installed: `which ffmpeg`
2. Verify the input file exists and is not corrupted
3. Check available disk space for output files
4. Review ffmpeg error messages for specific issues
