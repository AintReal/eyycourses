# Windows Video Fix - The Real Solution

## The Problem

Your videos have **audio but no picture on Windows** because:

- macOS supports almost any codec (QuickTime/AVFoundation)
- Windows browsers **ONLY** support specific codecs
- Your video is likely **H.265 (HEVC)** or **H.264 with wrong profile/pixel format**
- Windows browsers say: "I can play AAC audio... but WTF is this video?"

## The ONLY Safe Web Combo

**Memorize this:**

```
✅ Video: H.264 (AVC)
   - Profile: main (or baseline)
   - Pixel format: yuv420p (REQUIRED)

✅ Audio: AAC

✅ Container: MP4

Anything else = pain on Windows.
```

## The Fix (Implemented)

All videos uploaded through the admin dashboard are now automatically converted to:

```bash
H.264 Main profile
+ yuv420p pixel format
+ AAC audio
+ MP4 container with faststart
```

This is **browser-safe. Period.**

## How to Test

### 1. Upload a video through admin dashboard
- Any format (MP4, MOV, AVI, etc.)
- System will convert to web-safe format

### 2. Check browser console
You should see:
```
✅ FFmpeg loaded - ready to convert to H.264 Main + yuv420p
🎬 Converting to web-safe format (H.264 Main + AAC + yuv420p)...
✅ Converted to H.264 Main + yuv420p + AAC
```

### 3. Test on Windows
- Open video in Windows Chrome/Edge
- Should now show **picture + audio**

## For Old Videos

Videos uploaded before this fix need to be re-uploaded:

### Option 1: Re-upload through dashboard
1. Upload the video again
2. System will auto-convert

### Option 2: Manual conversion
```bash
# Single video
./convert-videos.sh input.mp4

# Batch convert
./batch-convert-videos.sh /path/to/videos/
```

## Verify a Video is Web-Safe

```bash
ffmpeg -i video.mp4
```

**You WANT to see:**
```
Video: h264 (Main), yuv420p
Audio: aac
```

**BAD signs:**
```
Video: hevc           ❌ (HEVC/H.265)
Video: h264 (High 10) ❌ (wrong profile)
yuv422p or yuv444p    ❌ (wrong pixel format)
```

## Why This Works

- **H.264** = universal video codec
- **Main profile** = works on all browsers (baseline is even safer but larger)
- **yuv420p** = REQUIRED for Windows + mobile browsers
- **faststart** = allows streaming before full download
- **AAC** = universal audio codec

Windows browsers can't decode:
- ❌ HEVC/H.265 (unless user installs codecs, which they won't)
- ❌ H.264 High 10 profile
- ❌ yuv422p or yuv444p pixel formats

## Summary

- **Problem**: Video codec incompatible with Windows browsers
- **Solution**: Force H.264 Main + yuv420p + AAC conversion
- **Result**: Works on Windows, Mac, mobile - everywhere

**All new uploads are automatically converted. Re-upload old videos.**
