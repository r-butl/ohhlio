import React from 'react';
import './NavBar.css';

interface NavBarProps {
    isEditMode: boolean;
    isEditing: boolean;
    setIsEditMode: (value: boolean) => void;
    isHomeUser: boolean;
}

const NavBar: React.FC<NavBarProps> = ({
    isEditMode,
    isEditing,
    setIsEditMode,
    isHomeUser
}) => {
    
    return (
    
    <div className="app-nav-bar">
        <h1>Ohhlio</h1>

        <div className="controls">

            { isHomeUser &&
                <button
                    className="button control"
                    onClick={() => setIsEditMode(!isEditMode)}
                    disabled={isEditing}
                >
                    {isEditMode ? 'Preview' : 'Edit'}
                </button>
            }

            <button 
                className="button profile"
            >
                Profile
            </button>
            

        </div>
    </div>
    )
}

export default NavBar;