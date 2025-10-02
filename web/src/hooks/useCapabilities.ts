import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for checking user capabilities
 * 
 * This hook provides capability checking for the frontend to:
 * 1. Show/hide UI elements based on capabilities
 * 2. Enable/disable actions based on capabilities
 * 3. Support custom roles from Role Wizard
 * 
 * NO MORE ROLE CONFUSION - checks capabilities, not role names
 */

interface UseCapabilitiesReturn {
  hasCapability: (capability: string) => boolean;
  hasAnyCapability: (capabilities: string[]) => boolean;
  hasAllCapabilities: (capabilities: string[]) => boolean;
  capabilities: string[];
  isAdmin: boolean;
  role: string | undefined;
}

export function useCapabilities(): UseCapabilitiesReturn {
  const { user } = useAuth();

  /**
   * Check if user has a specific capability
   * Admin automatically has all capabilities
   */
  const hasCapability = (capability: string): boolean => {
    if (!user) return false;
    
    // Admin has all capabilities
    if (user.role === 'admin') return true;
    
    // Check if user has the capability
    return user.capabilities?.includes(capability) || false;
  };

  /**
   * Check if user has ANY of the specified capabilities
   * Useful for showing UI when user has at least one permission
   */
  const hasAnyCapability = (capabilities: string[]): boolean => {
    if (!user) return false;
    
    // Admin has all capabilities
    if (user.role === 'admin') return true;
    
    // Check if user has any of the capabilities
    return capabilities.some(cap => user.capabilities?.includes(cap));
  };

  /**
   * Check if user has ALL of the specified capabilities
   * Useful for actions that require multiple permissions
   */
  const hasAllCapabilities = (capabilities: string[]): boolean => {
    if (!user) return false;
    
    // Admin has all capabilities
    if (user.role === 'admin') return true;
    
    // Check if user has all of the capabilities
    return capabilities.every(cap => user.capabilities?.includes(cap));
  };

  return {
    hasCapability,
    hasAnyCapability,
    hasAllCapabilities,
    capabilities: user?.capabilities || [],
    isAdmin: user?.role === 'admin',
    role: user?.role
  };
}

/**
 * Higher-Order Component for capability-based rendering
 * 
 * Usage:
 * <RequireCapability capability="budgets.approve">
 *   <ApproveButton />
 * </RequireCapability>
 */
interface RequireCapabilityProps {
  capability: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireCapability({ capability, children, fallback = null }: RequireCapabilityProps) {
  const { hasCapability } = useCapabilities();
  
  return hasCapability(capability) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-Order Component for requiring ANY capability
 * 
 * Usage:
 * <RequireAnyCapability capabilities={['budgets.view', 'budgets.approve']}>
 *   <BudgetSection />
 * </RequireAnyCapability>
 */
interface RequireAnyCapabilityProps {
  capabilities: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAnyCapability({ capabilities, children, fallback = null }: RequireAnyCapabilityProps) {
  const { hasAnyCapability } = useCapabilities();
  
  return hasAnyCapability(capabilities) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-Order Component for requiring ALL capabilities
 * 
 * Usage:
 * <RequireAllCapabilities capabilities={['budgets.view', 'budgets.approve']}>
 *   <ApproveAllButton />
 * </RequireAllCapabilities>
 */
interface RequireAllCapabilitiesProps {
  capabilities: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAllCapabilities({ capabilities, children, fallback = null }: RequireAllCapabilitiesProps) {
  const { hasAllCapabilities } = useCapabilities();
  
  return hasAllCapabilities(capabilities) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Example Usage in Components:
 * 
 * // Basic capability check
 * function BudgetPage() {
 *   const { hasCapability } = useCapabilities();
 *   
 *   return (
 *     <div>
 *       {hasCapability('budgets.view') && <BudgetList />}
 *       {hasCapability('budgets.create') && (
 *         <button onClick={createBudget}>Create Budget</button>
 *       )}
 *       {hasCapability('budgets.approve') && (
 *         <button onClick={approveBudget}>Approve</button>
 *       )}
 *     </div>
 *   );
 * }
 * 
 * // Using HOC
 * function BudgetActions() {
 *   return (
 *     <div>
 *       <RequireCapability capability="budgets.create">
 *         <CreateButton />
 *       </RequireCapability>
 *       
 *       <RequireCapability capability="budgets.approve">
 *         <ApproveButton />
 *       </RequireCapability>
 *     </div>
 *   );
 * }
 * 
 * // Check multiple capabilities
 * function AdminPanel() {
 *   const { hasAnyCapability, hasAllCapabilities } = useCapabilities();
 *   
 *   // Show panel if user has ANY admin capability
 *   if (!hasAnyCapability(['users.view', 'organizations.view', 'audit_logs.view'])) {
 *     return <AccessDenied />;
 *   }
 *   
 *   return (
 *     <div>
 *       {hasCapability('users.view') && <UserManagement />}
 *       {hasCapability('organizations.view') && <OrganizationManagement />}
 *       
 *       {hasAllCapabilities(['users.delete', 'organizations.delete']) && (
 *         <DangerZone />
 *       )}
 *     </div>
 *   );
 * }
 */
