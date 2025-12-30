import React from 'react';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => (
    <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
    </header>
);

export default Header;
