# Torque Client Testing Documentation

This document describes the comprehensive testing setup for the Torque Client application.

## Testing Infrastructure

### Frameworks and Tools
- **Vitest**: Primary testing framework for unit and integration tests
- **Testing Library**: React component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW (Mock Service Worker)**: API mocking for tests
- **JSDOM**: Browser environment simulation

### Test Categories

#### 1. Unit Tests
Located in `src/**/*.test.{ts,tsx}`

**TorqueForm Tests** (`src/components/dynamic/TorqueForm.test.tsx`)
- Form field rendering and validation
- Conditional logic (showIf/requiredIf)
- Real-time validation on blur/change
- Form submission and cancellation
- File upload handling
- Multi-section forms with dividers
- Default value handling

**DataGrid Tests** (`src/components/dynamic/DataGrid.test.tsx`)
- Table rendering with columns and data
- Sorting functionality with indicators
- Filtering with different data types
- Inline editing with save/cancel
- Row selection and bulk operations
- Pagination controls
- Import button integration
- Empty states and error handling

**ImportWizard Tests** (`src/components/dynamic/ImportWizard.test.tsx`)
- File upload (CSV/Excel) with validation
- 4-step wizard navigation
- Field mapping with auto-detection
- Data transformation options
- Preview and validation
- Import execution with progress tracking
- Error handling and retry logic

**ErrorBoundary Tests** (`src/components/ErrorBoundary.test.tsx`)
- Error catching and display
- Recovery mechanisms (retry/reload)
- Error logging to localStorage
- Custom fallback components
- HOC wrapper functionality

**useApiWithRetry Tests** (`src/hooks/useApiWithRetry.test.tsx`)
- Exponential backoff retry logic
- Network error handling
- Abort functionality
- Loading states
- Online/offline detection
- Concurrent request handling

#### 2. Integration Tests
Located in `src/test/integration/`

**JSON-RPC API Tests** (`jsonrpc-api.test.ts`)
- Complete API endpoint testing
- Page loading operations
- Entity CRUD operations
- Bulk import functionality
- Error handling scenarios
- Performance and concurrency testing
- Data validation edge cases

#### 3. End-to-End Tests
Located in `src/test/e2e/`

**Data Entry Workflows** (`data-entry-workflows.test.ts`)
- Complete user workflows
- Form submission and validation
- Data grid interactions
- Import wizard flows
- Error recovery scenarios
- Accessibility and keyboard navigation

#### 4. Performance Tests
Located in `src/test/performance/`

**Large Dataset Tests** (`large-dataset.test.tsx`)
- DataGrid performance with 1000+ rows
- Virtual scrolling implementation
- Fast filtering and sorting
- Memory usage optimization
- Import processing of large files
- Concurrent operations testing

### Test Configuration

#### Vitest Setup (`vitest.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

#### Test Setup (`src/test/setup.ts`)
- Browser API mocks (IntersectionObserver, FileReader, etc.)
- MSW server configuration
- JSON-RPC hooks mocking
- Clipboard API mocking

#### Mock Server (`src/test/mocks/server.ts`)
- Complete JSON-RPC endpoint simulation
- Realistic data responses
- Error scenario handling
- Performance testing endpoints

### Available Test Scripts

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:e2e
```

### Test Coverage Areas

#### Functional Coverage
- ✅ Form validation and conditional logic
- ✅ Data grid operations (CRUD, filtering, sorting)
- ✅ Import/export workflows
- ✅ Error handling and recovery
- ✅ API communication patterns
- ✅ User interaction flows

#### Performance Coverage
- ✅ Large dataset handling (1000+ rows)
- ✅ Memory usage optimization
- ✅ API response times
- ✅ Concurrent operations
- ✅ File processing efficiency

#### Error Coverage
- ✅ Network failures and retries
- ✅ Validation errors
- ✅ Component error boundaries
- ✅ API error responses
- ✅ File upload failures

#### Accessibility Coverage
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ ARIA attributes

### Performance Benchmarks

#### DataGrid Performance Targets
- Initial render with 1000 rows: < 2 seconds
- Virtual scrolling with 10k rows: < 5 seconds
- Filtering response time: < 1 second
- Sorting response time: < 500ms
- Inline editing: < 100ms per cell

#### Import Performance Targets
- CSV processing (10k rows): < 30 seconds
- Memory-efficient chunked processing: 1000 rows/chunk
- File upload validation: < 100ms
- Field mapping auto-detection: < 500ms

### Best Practices

#### Test Organization
- One test file per component/hook
- Descriptive test names following Given-When-Then
- Grouped tests by functionality
- Clear setup and teardown

#### Mocking Strategy
- Mock external dependencies (APIs, file system)
- Use real implementations for business logic
- Provide realistic test data
- Handle error scenarios

#### Performance Testing
- Measure actual execution times
- Test with realistic data volumes
- Monitor memory usage patterns
- Validate user experience metrics

### Continuous Integration

The testing suite is designed to run in CI environments with:
- Parallel test execution
- Coverage reporting
- Performance regression detection
- Cross-browser compatibility (via Playwright)

### Troubleshooting

Common issues and solutions:
- **MSW not intercepting requests**: Check server setup in test files
- **Component rendering errors**: Verify mock implementations
- **Performance test timeouts**: Adjust timeout values for slow environments
- **File upload tests failing**: Check FileReader mock configuration

### Future Enhancements

Planned improvements:
- Visual regression testing with Playwright
- A11y testing automation
- Performance monitoring integration
- Cross-device testing scenarios
- Advanced user interaction simulation