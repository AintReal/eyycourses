const express = require('express');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
app.use(express.json());

// Supabase credentials from Railway environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

ffmpeg.setFfmpegPath(ffmpegPath);

app.get('/health', (req, res) => res.status(200).send('ok'));

function sanitizeFilename(filename) {
  return String(filename || '')
    .split('/')
    .pop()
    .replace(/[^a-zA-Z0-9_.-]/g, '');
}

async function convertAndUpload({ bucket, filePath }) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }
  if (!bucket || !filePath) {
    throw new Error('Missing bucket or filePath');
  }

  const safeName = sanitizeFilename(filePath);
  if (!safeName) {
    throw new Error(`Could not derive a safe filename from: ${filePath}`);
  }

  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, safeName);
  const outputPath = path.join(tmpDir, `converted_${safeName}`);

  try {
    // Download video from Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) throw error;

    fs.writeFileSync(inputPath, Buffer.from(await data.arrayBuffer()));

    // Convert to web-safe MP4 (H.264 Main + yuv420p + AAC)
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-profile:v main',
          '-pix_fmt yuv420p',
          '-crf 23',
          '-c:a aac',
          '-b:a 160k',
          '-movflags +faststart',
          '-preset veryfast',
          '-threads 1'
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Upload converted file
    const fileBuffer = fs.readFileSync(outputPath);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(
      `converted/${safeName}`,
      fileBuffer,
      { contentType: 'video/mp4', upsert: true }
    );
    if (uploadError) throw uploadError;

    console.log('Video conversion and upload successful!', {
      bucket,
      input: filePath,
      output: `converted/${safeName}`
    });
  } finally {
    // Clean up temp files
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
  }
}

app.post('/api/convert-video', (req, res) => {
  console.log('Webhook triggered!');
  console.log('Payload:', req.body);

  // Respond immediately to avoid Supabase webhook timeout
  res.status(200).json({ received: true });

  // Handle Supabase webhook payload shapes
  let bucket, filePath;
  if (req.body && req.body.record) {
    bucket = req.body.record.bucket_id;
    filePath = req.body.record.name;
  } else if (req.body) {
    bucket = req.body.bucket;
    filePath = req.body.filePath;
  }

  // Background conversion (don't await)
  convertAndUpload({ bucket, filePath }).catch((err) => {
    console.error('Background conversion failed:', err);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));