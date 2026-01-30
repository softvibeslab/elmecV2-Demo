import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/supabase';

/**
 * Hook para manejar permisos basados en roles de usuario
 * Roles: customer, agent, admin
 */
export function useUserRole() {
    const { user } = useAuth();

    const role = user?.rol || 'customer';
    const zona = user?.zona;

    // Helpers de rol
    const isCustomer = role === 'customer';
    const isAgent = role === 'agent';
    const isAdmin = role === 'admin';

    // Permisos
    const canCreateRequests = true; // Todos pueden crear solicitudes
    const canReceiveRequests = isAgent || isAdmin;
    const canCreateGroupChat = isAgent || isAdmin;
    const canSeeAllUsers = isAdmin;

    /**
     * Filtra usuarios visibles según rol del usuario actual
     * - Customer: solo ve agentes de su zona
     * - Agent: ve usuarios de su zona
     * - Admin: ve todos
     */
    const getVisibleUsers = (allUsers: User[]): User[] => {
        if (isAdmin) {
            return allUsers.filter(u => u.id !== user?.id);
        }

        if (isCustomer) {
            // Clientes solo ven agentes de su zona
            return allUsers.filter(
                u => u.id !== user?.id && u.rol === 'agent' && (!zona || u.zona === zona)
            );
        }

        if (isAgent && zona) {
            // Agentes ven usuarios de su zona
            return allUsers.filter(u => u.id !== user?.id && u.zona === zona);
        }

        return allUsers.filter(u => u.id !== user?.id);
    };

    /**
     * Verifica si el usuario actual puede chatear con otro usuario
     * - Customer solo puede chatear con agents
     * - Agent y Admin pueden chatear con cualquiera
     */
    const canChatWith = (targetUser: User): boolean => {
        if (isAdmin || isAgent) return true;
        if (isCustomer && targetUser.rol === 'agent') return true;
        return false;
    };

    /**
     * Verifica si el usuario actual puede enviar solicitud a otro usuario
     */
    const canSendRequestTo = (targetUser: User): boolean => {
        // Solo se pueden enviar solicitudes a agentes
        return targetUser.rol === 'agent' || targetUser.rol === 'admin';
    };

    return {
        role,
        zona,
        isCustomer,
        isAgent,
        isAdmin,
        canCreateRequests,
        canReceiveRequests,
        canCreateGroupChat,
        canSeeAllUsers,
        getVisibleUsers,
        canChatWith,
        canSendRequestTo,
    };
}
