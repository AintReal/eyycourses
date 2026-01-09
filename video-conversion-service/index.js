const express = require('express');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const app = express();
app.use(express.json());

// Replace with your Supabase credentials (set these in Railway Variables, not here)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

ffmpeg.setFfmpegPath(ffmpegPath);

app.post('/api/convert-video', async (req, res) => {
  const { bucket, filePath } = req.body;
  if (!bucket || !filePath) return res.status(400).json({ error: 'Missing bucket or filePath' });

  try {
    // Download video from Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) throw error;

    // Convert video to H.264 Main + yuv420p + AAC
    const outputPath = `/tmp/converted.mp4`;
    ffmpeg(data)
      .outputOptions([
        '-c:v libx264',
        '-profile:v main',
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-movflags +faststart'
      ])
      .save(outputPath)
      .on('end', async () => {
        // Upload converted video back to Supabase Storage
        const fileBuffer = fs.readFileSync(outputPath);
        const { error: uploadError } = await supabase.storage.from(bucket).upload(
          `converted/${filePath.split('/').pop()}`,
          fileBuffer,
          { contentType: 'video/mp4', upsert: true }
        );
        if (uploadError) throw uploadError;
        res.json({ success: true });
      })
      .on('error', err => {
        res.status(500).json({ error: err.message });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));