/**
 * Icon Generation Script
 * Generates Chrome extension icons from master logo with cache-busting hashes
 * 
 * Usage: node scripts/generate-icons.js
 * Requires: npm install sharp crypto
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const SOURCE_DIR = path.join(__dirname, '..', 'public', 'brand');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'brand');

const SIZES = [
  { name: 'icon-16.png', size: 16 },
  { name: 'icon-48.png', size: 48 },
  { name: 'icon-128.png', size: 128 },
  { name: 'logo-v1-final.png', size: 256 },
];

function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

async function generateIcons() {
  const masterPath = path.join(SOURCE_DIR, 'master-logo.png');
  
  if (!fs.existsSync(masterPath)) {
    console.error('❌ master-logo.png not found in public/brand/');
    console.log('Please place your master logo at: public/brand/master-logo.png');
    process.exit(1);
  }

  console.log('🎨 Generating icons from master-logo.png...');

  try {
    const masterImage = sharp(masterPath);
    const metadata = await masterImage.metadata();
    console.log(`   Source: ${metadata.width}x${metadata.height}px`);

    const generatedFiles = [];

    for (const { name, size } of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);
      const buffer = await masterImage
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      fs.writeFileSync(outputPath, buffer);
      
      const hash = generateHash(buffer);
      generatedFiles.push({ name, hash, size });
      console.log(`   ✅ Generated: ${name} (${size}x${size}) [${hash}]`);
    }

    // Generate manifest icon mapping with hashes
    const manifestIcons = {};
    for (const { name, hash, size } of generatedFiles) {
      manifestIcons[`${size}`] = `/brand/${name}?v=${hash}`;
    }

    // Write hash manifest for build script
    const hashManifestPath = path.join(OUTPUT_DIR, 'icon-hashes.json');
    fs.writeFileSync(hashManifestPath, JSON.stringify(manifestIcons, null, 2));
    console.log(`   ✅ Hash manifest written to icon-hashes.json`);

    console.log('\n✨ All icons generated with cache-busting hashes!');
    console.log('📁 Output directory:', OUTPUT_DIR);
    console.log('\n📋 Manifest icons ready for injection:');
    console.log(manifestIcons);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
