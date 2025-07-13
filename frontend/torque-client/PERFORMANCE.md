# TorqueApp Performance Optimization

## Issue
The development build loads hundreds of individual module chunks, causing slow page loads.

## Solution

### For Development (with optimizations)
The Vite configuration has been updated with:
- Pre-bundled dependencies (`optimizeDeps.include`)
- Warmup for critical files
- Manual chunking strategy

### For Production-like Performance
Use the production build instead of development mode:

```bash
# Build the production version
npm run build

# Serve the production build
npm run preview
```

The production build:
- Bundles all modules into 4-5 optimized chunks
- Reduces from ~6000 modules to ~5 files
- Significantly faster initial page load
- Proper code splitting for lazy loading

## Bundle Analysis
Production build creates:
- `react-vendor.js` - React core libraries
- `mantine-vendor.js` - Mantine UI components
- `icons.js` - Icon library (lazy loaded)
- `index.js` - Application code
- `index.css` - All styles

Total bundle size: ~840KB (228KB gzipped)

## Running Both Environments

### Development (for hot reloading)
```bash
npm run dev
```

### Production Preview (for performance testing)
```bash
npm run build && npm run preview
```