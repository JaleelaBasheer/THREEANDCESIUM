import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch data from the server
    fetch('https://podselectronjsonserver.onrender.com/installation')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  const deleteAllData = async () => {
    setLoading(true);
    try {
      const deleteRequests = data.map(user =>
        fetch(`https://podselectronjsonserver.onrender.com/installation/${user.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to delete user with id ${user.id}`);
          }
        })
      );

      await Promise.all(deleteRequests);
      alert('All data deleted successfully');
      setData([]); // Clear the data from state
    } catch (error) {
      setError(error);
      alert(`Error deleting data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{ zIndex: '1' }}>
      <h1>Admin Page</h1>
      <button onClick={deleteAllData} className='btn btn-danger'>
        Delete All Data
      </button>
      <div className="table-container">
        <table className="linetable" style={{ color: 'black' }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>App ID</th>
              <th>Installed Date</th>
              <th>Password</th>
              <th>Usage Count</th>
              <th>Last Usage Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user) => (
              <tr key={user.id}>
                <td>{user.username || '-'}</td>
                <td>{user.email || '-'}</td>
                <td>{user.appId || '-'}</td>
                <td>{user.installeddate || '-'}</td>
                <td>{user.password || '-'}</td>
                <td>{user.usageCount || '-'}</td>
                <td>{user.lastUsageDate || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPage;
