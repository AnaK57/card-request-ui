import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SupportForm = () => {
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    oib: '',
    cardStatus: 'PENDING',
  });

  const [allClients, setAllClients] = useState([]);
  const [searchOib, setSearchOib] = useState('');
  const [searchedClient, setSearchedClient] = useState(null);

  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [statusUpdate, setStatusUpdate] = useState({
    oib: '',
    status: 'PENDING',
  });
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  useEffect(() => {
    fetchAllClients();
  }, []);

  const fetchAllClients = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/clients');
      setAllClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientData({ ...clientData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage('');
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:8080/api/clients', clientData);
      setResponseMessage(`Client added: ${response.data.firstName} ${response.data.lastName}`);
      setClientData({ firstName: '', lastName: '', oib: '', cardStatus: 'PENDING' });
      fetchAllClients();
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        setErrorMessage('An error occurred while submitting the form.');
      }
      console.error(error);
    }
  };

  const handleSearchClient = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/clients/${searchOib}`);
      setSearchedClient(response.data);
      setErrorMessage('');
    } catch (error) {
      setSearchedClient(null);
      setErrorMessage('Client not found.');
    }
  };

  const handleDeleteClient = async (oib) => {
    if (window.confirm(`Are you sure you want to delete the client with OIB: ${oib}?`)) {
      try {
        await axios.delete(`http://localhost:8080/api/clients/${oib}`);
        setResponseMessage(`Client with OIB ${oib} has been deleted.`);
        fetchAllClients();
      } catch (error) {
        setErrorMessage('Error occurred while deleting client.');
      }
    }
  };

  const handleStatusUpdateChange = (e) => {
    const { name, value } = e.target;
    setStatusUpdate({ ...statusUpdate, [name]: value });
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    setStatusUpdateMessage('');
    try {
      const response = await axios.post('http://localhost:8080/kafka/card-status/update', statusUpdate);
      setStatusUpdateMessage(response.data);
      setStatusUpdate({ oib: '', status: 'PENDING' });
      await fetchAllClients();
    } catch (error) {
      setStatusUpdateMessage('Error occurred while updating card status.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Add New Client</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            className="form-control"
            value={clientData.firstName}
            onChange={handleChange}
            required
            maxLength="30"
          />
        </div>
        <div className="mb-3">
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            className="form-control"
            value={clientData.lastName}
            onChange={handleChange}
            required
            maxLength="30"
          />
        </div>
        <div className="mb-3">
          <label>OIB</label>
          <input
            type="text"
            name="oib"
            className="form-control"
            value={clientData.oib}
            onChange={handleChange}
            required
            minLength="11"
            maxLength="11"
          />
        </div>
        <div className="mb-3">
          <label>Card Status</label>
          <select
            name="cardStatus"
            className="form-select"
            value={clientData.cardStatus}
            onChange={handleChange}
            required
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>

      {responseMessage && <div className="alert alert-success mt-3">{responseMessage}</div>}

      <hr />

      <h2>All Clients</h2>
      <ul className="list-group">
        {allClients.length === 0 && <li className="list-group-item">No clients available.</li>}
        {allClients.map(client => (
          <li key={client.oib} className="list-group-item d-flex justify-content-between align-items-center">
            {client.firstName} {client.lastName} - OIB: {client.oib} - Status: {client.cardStatus}
            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClient(client.oib)}>Delete</button>
          </li>
        ))}
      </ul>

      <hr />

      <h2>Search Client by OIB</h2>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter OIB"
          value={searchOib}
          onChange={(e) => setSearchOib(e.target.value)}
          minLength="11"
          maxLength="11"
        />
        <button className="btn btn-info" onClick={handleSearchClient}>Search</button>
      </div>

      {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}

      {searchedClient && (
        <div className="alert alert-secondary">
          <strong>First Name:</strong> {searchedClient.firstName}<br />
          <strong>Last Name:</strong> {searchedClient.lastName}<br />
          <strong>OIB:</strong> {searchedClient.oib}<br />
          <strong>Status:</strong> {searchedClient.cardStatus}
        </div>
      )}

      <hr />

      <h2>Update Card Status (Kafka)</h2>
      <form onSubmit={handleStatusUpdateSubmit}>
        <div className="mb-3">
          <label>OIB</label>
          <input
            type="text"
            name="oib"
            className="form-control"
            value={statusUpdate.oib}
            onChange={handleStatusUpdateChange}
            required
            minLength="11"
            maxLength="11"
          />
        </div>
        <div className="mb-3">
          <label>New Status</label>
          <select
            name="status"
            className="form-select"
            value={statusUpdate.status}
            onChange={handleStatusUpdateChange}
            required
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <button type="submit" className="btn btn-warning">Submit Status Update</button>
      </form>

      {statusUpdateMessage && <div className="alert alert-info mt-3">{statusUpdateMessage}</div>}
    </div>
  );
};

export default SupportForm;

