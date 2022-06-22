import { useAuth } from "../contexts/authContext";
import { validateUserPermissions } from "../utils/validateUserPermission";

interface useCanProps {
  permissions?: string[];
  roles?: string[];
}

export const useCan = ({ permissions = [], roles = [] }: useCanProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return false;
  }

  const useHasValidPermissions = validateUserPermissions({
    user,
    permissions,
    roles,
  });

  return useHasValidPermissions;
};
