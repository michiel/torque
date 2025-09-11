# GitHub Workflows for Torque Desktop

This directory contains automated workflows for building and releasing Torque Desktop across multiple platforms.

## 🚀 Workflows

### 1. `manual-build.yml` - Main Release Builder

**Purpose**: Builds and publishes official releases with platform-specific installers.

**Triggers**:
- Tag push: `v*` (e.g., `v1.0.0`)
- Manual dispatch via GitHub Actions UI

**Outputs**:
- **Windows**: `.msi` installer + `.exe` binary
- **macOS**: `.dmg` installer for Intel & ARM64 + binaries  
- **Linux**: `.deb` + `.rpm` packages + binary

**Features**:
- ✅ Efficient caching (avoids unnecessary rebuilds)
- ✅ Shared frontend build across platforms
- ✅ Native compilation for best compatibility
- ✅ Automatic GitHub release creation
- ✅ SHA256 checksums for verification

### 2. `test-build.yml` - Configuration Tester

**Purpose**: Validates build configuration without building.

**Triggers**:
- Manual dispatch
- Pull requests affecting workflows/config

**Checks**:
- Tauri configuration validity
- Icon file existence  
- Frontend structure
- Build script availability

## 📋 Usage Examples

### Quick Release
```bash
# Create and push a tag to trigger automatic release
git tag v1.0.0
git push origin v1.0.0
```

### Manual Release
1. Go to **Actions** → **"Build and Release Torque Desktop"**
2. Click **"Run workflow"**
3. Choose options:
   - **Branch**: `main` (default)
   - **Profile**: `release` (default) or `debug`
   - **Skip cache**: Force rebuild everything

### Test Configuration
1. Go to **Actions** → **"Test Build Configuration"** 
2. Click **"Run workflow"**
3. Choose platform to test: `linux`, `windows`, or `macos`

## ⚙️ Workflow Architecture

### Phase 1: Frontend Build
- Runs once on Ubuntu
- Builds React frontend
- Uploads as artifact for sharing

### Phase 2: Platform Builds (Parallel)
- Native builds on platform-specific runners
- Downloads shared frontend
- Builds server binary + Tauri desktop app
- Generates platform-specific installers
- Uploads release artifacts

### Phase 3: Release Creation
- Downloads all platform artifacts
- Organizes files for release
- Creates GitHub release with installers
- Generates detailed release notes

## 🎯 Optimization Features

### Caching Strategy
1. **Frontend Dependencies**: `node_modules` cached by package-lock hash
2. **Rust Dependencies**: Cargo registry + build cache by Cargo.lock hash  
3. **Tauri CLI**: Binary cached per OS to avoid reinstalling
4. **Target-Specific**: Separate caches per platform for parallel builds

### Efficiency Improvements
- **Shared Frontend**: Built once, used by all platforms (saves ~5-10 minutes)
- **Native Compilation**: No cross-compilation complexity
- **Selective Bundles**: Each platform only builds its specific installer types
- **Fail-Fast**: Independent platform builds don't block each other

## 📁 Output Structure

After a successful release build:

```
GitHub Release v1.0.0/
├── torque-desktop-windows-x86_64.msi     # Windows installer
├── torque-desktop-windows-x86_64.exe     # Windows binary  
├── torque-desktop-macos-x86_64.dmg       # Intel Mac installer
├── torque-desktop-macos-aarch64.dmg      # ARM Mac installer
├── torque-desktop-linux-x86_64.deb       # Debian package
├── torque-desktop-linux-x86_64.rpm       # RedHat package
├── torque-server-*.{exe,binary}          # Server binaries
├── torque-desktop-*.{exe,binary}         # Desktop binaries
└── checksums-*.txt                       # SHA256 checksums
```

## 🔧 Configuration Files

- **`src-tauri/tauri.conf.json`**: Tauri app configuration with bundle settings
- **`scripts/build-release.sh`**: Local build script (mirrors CI process)
- **`RELEASE.md`**: Detailed release documentation

## 🐛 Troubleshooting

### Common Issues
1. **"Frontend not found"**: Ensure frontend builds successfully in Phase 1
2. **"Bundle generation failed"**: Check platform-specific dependencies
3. **"Release creation failed"**: Verify GITHUB_TOKEN permissions

### Debug Steps
1. Check the **Test Build Configuration** workflow first
2. Review workflow logs for specific error messages
3. Test locally with `./scripts/build-release.sh`
4. Use "Skip cache" option to force clean builds

### Platform-Specific Notes
- **Linux**: Requires system dependencies (webkit2gtk, etc.)
- **Windows**: Uses Strawberry Perl for OpenSSL builds
- **macOS**: Supports both Intel and ARM64 architectures

## 📚 Related Documentation

- [`RELEASE.md`](../../RELEASE.md): Complete release documentation
- [`scripts/build-release.sh`](../../scripts/build-release.sh): Local build script
- [Tauri Bundle Configuration](https://tauri.app/v1/guides/building/): Official Tauri docs