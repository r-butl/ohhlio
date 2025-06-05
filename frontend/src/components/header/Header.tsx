import React from 'react';
import './Header.css';

interface HeaderProps {
    isEditMode: boolean;
    isEditing: boolean;
    setIsEditMode: (value: boolean) => void;
    isHomeUser: boolean;
}

const Header: React.FC<HeaderProps> = ({
    isEditMode,
    isEditing,
    setIsEditMode,
    isHomeUser
}) => {
    
    return (
    
    <div className="app-header">
        <h1>ProjectBuilder</h1>
        <div className="controls">
        
        { isHomeUser &&
            <button
                className="mode-toggle"
                onClick={() => setIsEditMode(!isEditMode)}
                disabled={isEditing}
            >
                {isEditMode ? 'Preview' : 'Edit'}
            </button>
        }

        </div>
    </div>
    )
}

export default Header;