import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
      password: string;
    }
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const BASIC_AUTH = process.env.EXPO_PUBLIC_BASIC_AUTH === 'true';
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Get initial session (or skip in basic mode)
    const initializeAuth = async () => {
      try {
        if (BASIC_AUTH) {
          console.log('🔧 Modo BASIC AUTH activo: se omite Supabase Auth');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log(
          '🔄 Sesión inicial obtenida:',
          session ? 'Existe' : 'No existe'
        );
        setSession(session);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (skip in basic mode)
    let subscription: { unsubscribe: () => void } | undefined;
    if (!BASIC_AUTH) {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        console.log(
          '🔄 Cambio de autenticación detectado:',
          event,
          session ? 'Sesión activa' : 'Sin sesión'
        );
        setSession(session);

        if (session?.user && event !== 'TOKEN_REFRESHED') {
          await loadUserProfile(session.user.id);
        } else {
          console.log('🚪 Limpiando estado de usuario...');
          setUser(null);
          setLoading(false);
        }
      });
      subscription = sub;
    }

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Computed value for authentication status
  const isAuthenticated = BASIC_AUTH ? !!user : !!user && !!session;

  // Exponer funciones para debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).AuthContext = {
        user,
        isAuthenticated,
        logout,
        session,
      };
    }
  }, [user, isAuthenticated, session]);

  const loadUserProfile = async (userId: string) => {
    try {
      if (BASIC_AUTH) {
        // En modo básico no cargamos perfil desde la base de datos
        setLoading(false);
        return;
      }
      // Avoid loading if already loading or if user is already loaded
      if (user?.id === userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error.message);
        // If user doesn't exist in users table, sign out
        if (error.code === 'PGRST116') {
          console.log('User profile not found, signing out...');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        // For other errors, still set loading to false and throw
        setLoading(false);
        throw error;
      }

      // Set user data
      if (data.status_aprobacion === 'rechazado') {
        setLoading(false);
        throw new Error('Tu cuenta ha sido rechazada por el equipo de ELMEC.');
      }

      if (data.status_aprobacion === 'pendiente' && data.rol === 'customer') {
        setLoading(false);
        throw new Error(
          'Tu cuenta está pendiente de aprobación. Te notificaremos una vez activa.'
        );
      }

      setUser(data);

      // Update user online status (non-blocking)
      (supabase as any)
        .from('users')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          last_login: new Date().toISOString(),
        })
        .eq('id', userId)
        .then(({ error: updateError }: any) => {
          if (updateError) {
            console.error('Error updating user status:', updateError);
          }
        })
        .catch((updateErr: any) => {
          console.error('Failed to update user status:', updateErr);
        });

      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      if (BASIC_AUTH) {
        // Login básico: acepta cualquier email y contraseña no vacíos
        if (!email || !password) {
          throw new Error('Credenciales incompletas');
        }
        const now = new Date().toISOString();
        const mockUser: User = {
          id: `demo-${email}`,
          email,
          empresa: 'ELMEC',
          nombre: email.split('@')[0],
          apellido_paterno: '',
          apellido_materno: '',
          correo_electronico: email,
          celular: '',
          ciudad: '',
          estado: '',
          rol: 'customer',
          categoria: undefined,
          zona: undefined,
          activo: true,
          foto: undefined,
          created_at: now,
          updated_at: now,
          last_login: now,
          is_online: true,
          last_seen: now,
        };
        setUser(mockUser);
        // En modo básico no usamos sesión Supabase
        setSession(null);
        return true;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        // Re-throw with more specific error information
        const enhancedError = {
          ...error,
          code: error.message?.includes('Invalid login credentials')
            ? 'invalid_credentials'
            : error.code,
          userMessage: error.message?.includes('Invalid login credentials')
            ? 'Email o contraseña incorrectos'
            : error.message,
        };
        throw enhancedError;
      }

      if (data.user) {
        try {
          await loadUserProfile(data.user.id);
          return true;
        } catch (profileError) {
          console.error('Profile loading error:', profileError);
          // If profile loading fails, still consider login successful
          // but log the error for debugging
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
      password: string;
    }
  ): Promise<boolean> => {
    try {
      setLoading(true);
      if (BASIC_AUTH) {
        // Registro básico: simula creación de usuario
        const now = new Date().toISOString();
        const mockUser: User = {
          id: `demo-${userData.correo_electronico}`,
          email: userData.correo_electronico,
          empresa: userData.empresa || 'ELMEC',
          nombre: userData.nombre,
          apellido_paterno: userData.apellido_paterno || '',
          apellido_materno: userData.apellido_materno || '',
          correo_electronico: userData.correo_electronico,
          celular: userData.celular || '',
          ciudad: userData.ciudad || '',
          estado: userData.estado || '',
          rol: 'customer',
          categoria: userData.categoria,
          zona: userData.zona,
          activo: true,
          foto: undefined,
          created_at: now,
          updated_at: now,
          last_login: now,
          is_online: true,
          last_seen: now,
        };
        setUser(mockUser);
        setSession(null);
        return true;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.correo_electronico,
        password: userData.password,
      });

      if (authError) {
        console.error('Auth registration error:', authError);
        return false;
      }

      if (authData.user) {
        // Create user profile
        const { password, ...userProfile } = userData;
        const profileData = {
          id: authData.user.id,
          email: authData.user.email!,
          nombre: userProfile.nombre,
          apellido_paterno: userProfile.apellido_paterno,
          apellido_materno: userProfile.apellido_materno,
          empresa: userProfile.empresa,
          celular: userProfile.celular,
          correo_electronico: userProfile.correo_electronico,
          ciudad: userProfile.ciudad,
          estado: userProfile.estado,
          rol: 'customer' as const,
          activo: true,
          is_online: false,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await (supabase as any)
          .from('users')
          .insert(profileData);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return false;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Iniciando proceso de logout...');
      setLoading(true);

      if (BASIC_AUTH) {
        // Logout básico: limpiar estado local
        setSession(null);
        setUser(null);
      } else {
        // Update user status to offline
        if (user) {
          console.log('👤 Actualizando estado del usuario a offline...');
          try {
            const updateData = {
              is_online: false,
              last_seen: new Date().toISOString(),
            };
            const { error: updateError } = await (supabase as any)
              .from('users')
              .update(updateData)
              .eq('id', user.id);

            if (updateError) {
              console.error(
                '❌ Error updating user status on logout:',
                updateError
              );
            } else {
              console.log('✅ Estado del usuario actualizado correctamente');
            }
          } catch (updateErr) {
            console.error(
              '❌ Failed to update user status on logout:',
              updateErr
            );
          }
        }

        console.log('🚪 Cerrando sesión en Supabase...');
        const { error } = await supabase.auth.signOut();

        // Clear local state regardless of signOut result
        setSession(null);
        setUser(null);

        if (error) {
          console.error('❌ Logout error:', error);
        } else {
          console.log('✅ Sesión cerrada correctamente en Supabase');
        }
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear state even if there's an error
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de logout finalizado');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        session,
        loading,
        login,
        register,
        logout,
        refreshUser: async () => {
          if (user?.id) {
            await loadUserProfile(user.id);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
