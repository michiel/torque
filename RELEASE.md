# Torque Desktop Release Guide

This guide explains how to create platform-specific releases for Torque Desktop, including DMG files for macOS and MSI files for Windows.

## Release Formats

The Tauri configuration automatically generates the following installers:

- **macOS**: `.dmg` (Disk Image) - Professional drag-and-drop installer
- **Windows**: `.msi` (Windows Installer) - Standard Windows installer package
- **Linux**: `.deb` (Debian/Ubuntu) and `.rpm` (RedHat/Fedora/SUSE) packages

## Quick Start

### Using the Build Script (Recommended)

```bash
# From the project root directory
./scripts/build-release.sh
```

This script will:
1. ✅ Check all dependencies (Rust, Node.js, Tauri CLI)
2. ✅ Build the React frontend for production
3. ✅ Compile the Rust backend in release mode
4. ✅ Generate platform-specific installers
5. ✅ Show you where the files are located

### Manual Build Process

If you prefer to build manually:

```bash
# 1. Build frontend
cd frontend/model-editor
npm ci
npm run build
cd ../..

# 2. Build Tauri app with installers
cd src-tauri
cargo tauri build
cd ..
```

## Build Artifacts

After building, installers will be available in:

```
target/release/bundle/
├── dmg/           # macOS DMG files
│   └── Torque Desktop_0.1.0_x64.dmg
├── msi/           # Windows MSI files  
│   └── Torque Desktop_0.1.0_x64_en-US.msi
├── deb/           # Linux DEB packages
│   └── torque-desktop_0.1.0_amd64.deb
└── rpm/           # Linux RPM packages
    └── torque-desktop-0.1.0-1.x86_64.rpm
```

## Platform Requirements

### Cross-Compilation Notes

- **Building on Linux**: Creates Linux packages (DEB/RPM)
- **Building on macOS**: Can create macOS DMG files
- **Building on Windows**: Can create Windows MSI files

For true cross-platform builds, you'll need to either:
1. Build on each target platform separately, or
2. Use GitHub Actions with multiple runners (recommended for CI/CD)

## Configuration Details

The release configuration is defined in `src-tauri/tauri.conf.json`:

### DMG Configuration (macOS)
```json
"dmg": {
  "appPosition": { "x": 180, "y": 170 },
  "applicationFolderPosition": { "x": 480, "y": 170 },
  "window": { "width": 660, "height": 400 }
}
```

### MSI Configuration (Windows)
```json
"windows": {
  "msi": {
    "language": "en-US",
    "productName": "Torque Desktop",
    "manufacturerName": "Torque Contributors",
    "upgradeCode": "E7F10B2B-1F3C-4E4F-8A6E-2F8A3D9C5E7F"
  }
}
```

## Advanced Options

### Building Specific Formats

To build only specific installer types:

```bash
# Only DMG (macOS)
cargo tauri build --bundles dmg

# Only MSI (Windows) 
cargo tauri build --bundles msi

# Only Linux packages
cargo tauri build --bundles deb,rpm
```

### Debug Builds

For testing purposes, you can create debug installers:

```bash
cargo tauri build --debug
```

### Custom Configuration

You can override configuration values:

```bash
# Custom version
cargo tauri build --config '{"version":"1.0.0"}'

# Custom app name
cargo tauri build --config '{"productName":"My Custom App"}'
```

## Signing and Distribution

### macOS Code Signing
For macOS distribution, you'll need:
- Apple Developer account
- Code signing certificate
- Notarization for Gatekeeper

Add to `tauri.conf.json`:
```json
"bundle": {
  "macOS": {
    "signingIdentity": "Developer ID Application: Your Name",
    "providerShortName": "XXXXXXXXXX"
  }
}
```

### Windows Code Signing
For Windows distribution:
- Code signing certificate (from trusted CA)
- Windows SDK tools

Add to `tauri.conf.json`:
```json
"bundle": {
  "windows": {
    "certificateThumbprint": "CERTIFICATE_THUMBPRINT",
    "timestampUrl": "http://timestamp.digicert.com"
  }
}
```

## Troubleshooting

### Common Issues

1. **"Frontend dist not found"**
   - Make sure to build the frontend first: `npm run build`

2. **"Icon not found"**
   - Ensure all icon files exist in `src-tauri/icons/`

3. **"Cargo build failed"**
   - Check Rust compilation: `cargo check` in `src-tauri/`

4. **Permission errors on Linux**
   - Install system dependencies: `sudo apt install libwebkit2gtk-4.0-dev`

### Build Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install webkit2gtk3-devel openssl-devel curl wget libappindicator-gtk3-devel librsvg2-devel
sudo dnf group install "C Development Tools and Libraries"
```

## Version Management

Update version in multiple places:
1. `src-tauri/Cargo.toml` - Rust package version
2. `src-tauri/tauri.conf.json` - App version
3. `frontend/model-editor/package.json` - Frontend version

Or use the Tauri CLI:
```bash
cargo tauri version --bump patch  # 0.1.0 -> 0.1.1
cargo tauri version --bump minor  # 0.1.1 -> 0.2.0
cargo tauri version --bump major  # 0.2.0 -> 1.0.0
```

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/manual-build.yml`) automatically builds and publishes releases:

### Automated Release Workflow

**Triggers:**
- **Tag Push**: `git tag v1.0.0 && git push origin v1.0.0`
- **Manual**: Actions → "Build and Release Torque Desktop" → "Run workflow"

**What it does:**
1. **Frontend Build** (once): Builds React frontend and shares across platforms
2. **Platform Builds** (parallel): Builds on native runners for best compatibility
3. **Installer Generation**: Creates DMG, MSI, DEB, RPM packages automatically
4. **Release Creation**: Publishes GitHub release with all artifacts

### Build Matrix

| Platform | Runner | Installers | Artifacts |
|----------|--------|------------|-----------|
| **Linux x64** | `ubuntu-24.04` | `deb`, `rpm` | `.deb`, `.rpm`, binary |
| **Windows x64** | `windows-latest` | `msi` | `.msi`, `.exe` |
| **macOS Intel** | `macOS-latest` | `dmg` | `.dmg`, binary |
| **macOS ARM64** | `macOS-latest` | `dmg` | `.dmg`, binary |

### Caching & Efficiency

The workflow avoids rebuilds using:
- **Frontend caching**: `node_modules` cached between runs
- **Rust caching**: Dependencies and build artifacts cached
- **Tauri CLI caching**: CLI binary cached per OS
- **Shared frontend**: Built once, used by all platforms

### Manual Workflow Options

```bash
# Quick release build
git tag v1.0.1 && git push origin v1.0.1

# Manual workflow dispatch with options
# Go to: Actions → "Build and Release Torque Desktop"
# Choose: profile (debug/release), branch, skip_cache option
```

### Testing Configuration

Use the test workflow to validate setup:
```bash
# Triggers: .github/workflows/test-build.yml
# Validates: Tauri config, icons, frontend structure, build scripts
```

The workflow automatically creates professional releases with:
- ✅ Platform-specific installers (DMG/MSI/DEB/RPM)
- ✅ Portable executables for all platforms
- ✅ SHA256 checksums for verification
- ✅ Detailed release notes with installation instructions