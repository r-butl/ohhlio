import React from 'react';
import './NavBar.css';
import { useEditorStore } from "../../global-state/EditorStore";

interface NavBarProps {
    isHomeUser: boolean;  // This will be used to determine if user is the owner
}

const NavBar: React.FC<NavBarProps> = ({ isHomeUser }) => {
    // Get the editor mode and toggle function directly from the store
    const mode = useEditorStore(state => state.mode);
    const toggleEditorMode = useEditorStore(state => state.toggleEditorMode);
    const activeEditor = useEditorStore(state => state.activeEditor);
    
    // We'll use this to determine if editing is allowed
    const canEdit = isHomeUser;
    
    return (
        <div className="app-nav-bar">
            <h1>Ohhlio</h1>

            <div className="controls">
                {canEdit && (
                    <button
                        className="button control"
                        onClick={toggleEditorMode}
                        // Disable the button if we're in the middle of editing an item
                        disabled={activeEditor !== null}
                    >
                        {mode === 'edit' ? 'Preview' : 'Edit'}
                    </button>
                )}

                <button 
                    className="button profile"
                >
                    Profile
                </button>
            </div>
        </div>
    );
}

export default NavBar;