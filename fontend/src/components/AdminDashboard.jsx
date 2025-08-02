import React from 'react';

const Dashboard = () => {
    return (
        <div style={styles.dashboard}>
            <div style={styles.container}>
                <h2 style={styles.title}>Admin Dashboard</h2>
                <ul style={styles.navList}>
                    <li style={styles.navItem}>
                        <a
                            href="http://localhost:5000/admin/products"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.link}
                        >
                            Quản lý sản phẩm
                        </a>
                    </li>
                    <li style={styles.navItem}>
                        <a
                            href="http://localhost:5000/admin/contacts"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.link}
                        >
                            Quản lý liên hệ
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

const styles = {
    dashboard: {
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f9f9f9',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#ffffff',
        padding: '40px 60px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center',
    },
    title: {
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#2d3e50',
        marginBottom: '30px',
    },
    navList: {
        listStyleType: 'none',
        padding: 0,
    },
    navItem: {
        margin: '15px 0',
    },
    link: {
        display: 'inline-block',
        padding: '12px 25px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#fff',
        backgroundColor: '#2d3e50',
        textDecoration: 'none',
        borderRadius: '5px',
        width: '200px',
        textAlign: 'center',
        transition: 'background-color 0.3s ease',
    },
};

export default Dashboard;
