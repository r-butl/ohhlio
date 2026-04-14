export interface UserInterface {
    displayName?: string;   // For pretty displays
    email: string;          
    username?: string;      // For urls
};

export interface AuthContextInterface {
    user: UserInterface | null;
    token: string | null;
    login: (token: string, user: UserInterface) => void;
    logout: () => void;
    isAuthenticated: boolean;
};

export interface UserContextInterface {
    user: UserInterface;
    profileData: { profileImage: string; description: string; };
    setUser: React.Dispatch<React.SetStateAction<{ email: string; username: string;}>>; 
    loadingProfileData: boolean;        // For prettier handling of user loading
    fetchProfileData: () => Promise<void>;
};