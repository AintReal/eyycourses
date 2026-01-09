const express = require('express');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const app = express();
app.use(express.json());

// Supabase credentials from Railway environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

ffmpeg.setFfmpegPath(ffmpegPath);

app.post('/api/convert-video', async (req, res) => {
  console.log('Webhook triggered!');

  const express = require('express');
  const ffmpegPath = require('ffmpeg-static');
  const ffmpeg = require('fluent-ffmpeg');
  const { createClient } = require('@supabase/supabase-js');
  const fs = require('fs');

  const app = express();
  app.use(express.json());

  // Supabase credentials from Railway environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  ffmpeg.setFfmpegPath(ffmpegPath);

  app.get('/health', (req, res) => res.status(200).send('ok'));

  function sanitizeFilename(filename) {
    return filename.split('/').pop().replace(/[^a-zA-Z0-9_.-]/g, '');
  }

  app.post('/api/convert-video', async (req, res) => {
    console.log('Webhook triggered!');
    console.log('Payload:', req.body);

    // Respond immediately to avoid webhook timeout
    res.json({ received: true });

    // Handle Supabase webhook payload
    let bucket, filePath;
    if (req.body.record) {
      bucket = req.body.record.bucket_id;
      filePath = req.body.record.name;
    } else {
      bucket = req.body.bucket;
      filePath = req.body.filePath;
    }

    if (!bucket || !filePath) {
      console.error('Missing bucket or filePath');
      return;
    }

    const safeName = sanitizeFilename(filePath);
    const inputPath = `/tmp/${safeName}`;
    const outputPath = `/tmp/converted_${safeName}`;

    try {
      // Download video from Supabase Storage
      const { data, error } = await supabase.storage.from(bucket).download(filePath);
      if (error) throw error;

      fs.writeFileSync(inputPath, Buffer.from(await data.arrayBuffer()));

      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-profile:v main',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-movflags +faststart',
          '-preset ultrafast',
          '-threads 1',
          '-bufsize 1M'
        ])
        .on('end', async () => {
          try {
            const fileBuffer = fs.readFileSync(outputPath);
            const { error: uploadError } = await supabase.storage.from(bucket).upload(
              `converted/${safeName}`,
              fileBuffer,
              { contentType: 'video/mp4', upsert: true }
            );
            if (uploadError) throw uploadError;
            console.log('Video conversion and upload successful!');
          } catch (err) {
            console.error('Upload error:', err);
          } finally {
            // Clean up temp files
            try { fs.unlinkSync(inputPath); } catch (e) {}
            try { fs.unlinkSync(outputPath); } catch (e) {}
          }
        })
        .on('error', err => {
          console.error('FFmpeg error:', err);
          // Clean up temp files
          try { fs.unlinkSync(inputPath); } catch (e) {}
          try { fs.unlinkSync(outputPath); } catch (e) {}
        })
        .save(outputPath);
    } catch (err) {
      console.error('Conversion error:', err);
      // Clean up temp files
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    }
  });
})
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));