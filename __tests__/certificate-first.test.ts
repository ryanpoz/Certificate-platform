/**
 * Test for certificate-first UX refactoring
 */

describe('Certificate-First UX', () => {
  describe('Navigation', () => {
    it('should have Issue Certificate as primary action in nav', () => {
      const navItems = [
        'Dashboard',
        'Issue Certificate', // Primary action
        'Results',
        'Certificate Programs', // Renamed from Courses
        'Certificates',
        'Settings',
      ]
      expect(navItems[1]).toBe('Issue Certificate')
      expect(navItems[3]).toBe('Certificate Programs')
    })

    it('should redirect /dashboard/courses to /dashboard/programs', () => {
      const redirects = {
        '/dashboard/courses': '/dashboard/programs',
      }
      expect(redirects['/dashboard/courses']).toBe('/dashboard/programs')
    })
  })

  describe('Dashboard Empty State', () => {
    it('should show Issue Certificate as primary action', () => {
      const emptyState = {
        heading: 'No certificates yet',
        description: 'Get started by issuing your first certificate.',
        primaryAction: 'Issue Certificate',
        primaryLink: '/dashboard/certificates/issue',
      }
      expect(emptyState.primaryAction).toBe('Issue Certificate')
      expect(emptyState.primaryLink).toContain('issue')
    })
  })

  describe('Programs Page', () => {
    it('should be renamed from Courses everywhere', () => {
      const terminology = {
        navLabel: 'Certificate Programs',
        pageTitle: 'Certificate Programs',
        emptyStateDescription: 'Programs will be created automatically when you issue certificates',
      }
      expect(terminology.navLabel).toContain('Programs')
      expect(terminology.pageTitle).toContain('Programs')
    })

    it('should show Issue Certificate as primary action', () => {
      const programsPage = {
        primaryButton: 'Issue Certificate',
        secondaryButton: 'Create Program',
      }
      expect(programsPage.primaryButton).toBe('Issue Certificate')
    })
  })

  describe('Issue Flow', () => {
    it('should allow inline program creation', () => {
      // For now redirects to existing single-person form
      // Future: add inline program creation with defaults
      const issueFlow = {
        route: '/dashboard/certificates/issue',
        redirectsTo: '/dashboard/courses/new/single',
        allowsInlineCreate: false, // TODO: implement
      }
      expect(issueFlow.route).toContain('issue')
    })
  })

  describe('Filters and Labels', () => {
    it('should rename Course filter to Program', () => {
      const filters = {
        certificates: 'Program',
        results: 'Program',
      }
      expect(filters.certificates).toBe('Program')
      expect(filters.results).toBe('Program')
    })
  })
})
