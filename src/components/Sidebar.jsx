// src/components/Sidebar.jsx
import React from 'react';
import styled from 'styled-components';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const SidebarContainer = styled.div`
  width: 250px;
  background-color: #000;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #fff;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StyledNavLink = styled(NavLink)`
  background-color: #28a745;
  color: #fff;
  text-decoration: none;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  text-align: center;
  display: block; /* Makes the NavLink fill its parent container */

  &:hover {
    background-color: #218838;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #218838;
  }

  &.active {
    background-color: #218838; /* Active link color */
  }
`;

const Welcome = styled.div`
  margin-top: auto;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = location.state?.username || 'User';

    const handleLogout = () => {
        navigate('/');
    };

    return (
        <SidebarContainer>
            {/* Navigation List */}
            <NavList>
                <li><StyledNavLink to="/trips">Trips</StyledNavLink></li>
                <li><StyledNavLink to="/expenses">Expenses</StyledNavLink></li>
                <li><StyledNavLink to="/reports">Reports</StyledNavLink></li>
                <li><StyledNavLink to="/customers">Customers</StyledNavLink></li>
                <li><StyledNavLink to="/prt">PRT</StyledNavLink></li>
                <li><StyledNavLink to="/admin">Admin</StyledNavLink></li>
                <li><StyledNavLink to="/about">About</StyledNavLink></li>
            </NavList>

            <Welcome>
                <span>Welcome, {username}</span>
                <StyledNavLink to="/" onClick={handleLogout} style={{ backgroundColor: '#d9534f', marginTop: '20px' }}>
                    Logout
                </StyledNavLink>
            </Welcome>
        </SidebarContainer>
    );
};

export default Sidebar;