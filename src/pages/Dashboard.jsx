import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaFileExport, FaPlus } from 'react-icons/fa';
import Button from '../components/Button';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { deleteDoc } from 'firebase/firestore';

const Heading = styled.h1`
  font-weight: bold;
  text-align: center;
  color: #343a40;
  margin-bottom: 1.5rem;
  font-family: Aptos Display;
font-size:32px;
`;

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #fff;
font-family: Aptos Display;
font-size:16px;
`;

const ContentContainer = styled.div`
width: 90%;
max-width:100%;
  flex-grow: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: auto;
  margin-left: 20px; /* Add space between the sidebar and content */
`;

const SearchBar = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 15px;
  align-items: center;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 0.5rem;
    font-family: Aptos Display;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;
  width: 100%;
  &:focus {
    border-color: #007bff;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  
`;

const InputLabel = styled.label`
  font-weight: bold;
    font-family: Aptos Display;

  margin-bottom: 5px;
    font-size: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  grid-column: span 4;
`;

const RightSideContainer = styled.div`
  flex-grow: 1;
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const TableWrapper = styled.div`
  width: 100%; /* Make the table wrapper take full width */
    max-width: 100%; /* Prevent the wrapper from exceeding the screen width */
  overflow-x: auto; /* Add horizontal scroll if table exceeds screen width */
  margin-top: 20px;
  margin-left: auto;
  margin-right: auto;
    border: 1px solid #ddd; /* Optional border for better visibility */
  border-radius: 8px; /* Optional rounded corners */
`;

const StyledTable = styled(Table)`
  width: 100%; /* Ensure the table fits within its container */
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
`;

const StyledTableHead = styled(TableHead)`
  background-color: #343a40;
  color: #fff;

  th {
    padding: 12px;
      font-family: Aptos Display;
font-size:16px;
    text-align: left;
    color: #fff;
    position: sticky;
    top: 0;
    z-index: 1;
  }
`;

const StyledTableBody = styled(TableBody)`
  tr {
    &:nth-of-type(even) {
      background-color: #f9f9f9;
    }
    &:hover {
      background-color: #f1f1f1;
    }
  }
  td {
    padding: 12px;
    border-bottom: 1px solid #ddd;
    text-align: left;
          font-family: Aptos Display;
font-size:16px;

    white-space: nowrap; /* Prevent text wrapping */
    overflow: hidden; /* Hide overflowing text */
    text-overflow: ellipsis; /* Add ellipsis for overflowing text */
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const PaginationButton = styled.button`
  padding: 10px 15px;
  background-color: #002985;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
font-family: Aptos Display;
font-size:16px;

  &:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
`;

const Loader = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin: auto;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;




const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchData, setSearchData] = useState({ fromDate: '', toDate: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState(''); // Add state for user role

  const recordsPerPage = 5;

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    setLoggedIn(userData?.isLoggedIn || false);
    setUserRole(userData?.role || ''); // Assuming `role` is stored in the user data

  }, []);

  const openNewTab = () => {
    window.open('/addnewtrip', '_blank');
  };

  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSearchSubmit = async () => {
    setLoading(true);

    try {
      // Check and format dates if necessary
      const formatDate = (date) => {
        if (date.includes('-')) {
          const parts = date.split('-');
          if (parts[0].length === 4) {
            // Already in YYYY-MM-DD format
            return date;
          } else {
            // Convert from DD-MM-YYYY to YYYY-MM-DD
            const [day, month, year] = parts;
            return `${year}-${month}-${day}`;
          }
        }
        return date;
      };

      const fromDate = searchData.fromDate ? formatDate(searchData.fromDate) : null;
      const toDate = searchData.toDate ? formatDate(searchData.toDate) : null;

      console.log('Formatted From Date:', fromDate);
      console.log('Formatted To Date:', toDate);

      // Build the Firestore query
      const searchQuery = query(
        collection(db, 'trips'),
        ...(fromDate ? [where('tripDate', '>=', fromDate)] : []),
        ...(toDate ? [where('tripDate', '<=', toDate)] : [])
      );

      const querySnapshot = await getDocs(searchQuery);

      // Process results
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (results.length === 0) {
        toast.info('No records found for the specified date range.');
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      toast.error('Error fetching data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate the paginated data
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = searchResults.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(searchResults.length / recordsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleEdit = (rowData) => {
    // Pass the data to AddNewTrip page using URL parameters
    const queryParams = new URLSearchParams(rowData).toString();
    window.open(`/addnewtrip?${queryParams}`, '_blank');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        // Delete the document from Firestore
        await deleteDoc(doc(db, 'trips', id));
        toast.success('Record deleted successfully!');

        // Remove the deleted record from the local state
        setSearchResults((prevResults) => prevResults.filter((item) => item.id !== id));
      } catch (error) {
        toast.error('Error deleting record: ' + error.message);
      }
    }
  };

  const handleExport = () => {
    if (searchResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Define custom headers
    const headers = [
      { label: 'Trip Date', key: 'tripDate' },
      { label: 'Truck Plate Number', key: 'truckPlateNumber' },
      { label: 'Truck Driver Name', key: 'truckDriverName' },
      { label: 'Truck Category', key: 'truckCategory' },
      { label: 'Delivery Note', key: 'deliveryNote' },
      { label: 'Customer Name', key: 'customerName' },
      { label: 'C/O', key: 'cO' },
      { label: 'First Loading', key: 'firstLoading' },
      { label: 'First Offloading', key: 'firstOffloading' },
      { label: 'Second Loading', key: 'secondLoading' },
      { label: 'Second Offloading', key: 'secondOffloading' },
      { label: 'Customer Rate', key: 'customerRate' },
      { label: 'Customer Waiting Charges', key: 'customerWaitingCharges' },
      { label: 'Amount Received', key: 'amountReceived' },
      { label: 'Amount Balance', key: 'amountBalance' },
      { label: 'Driver Rate', key: 'driverRate' },
      { label: 'Driver Waiting Charges', key: 'driverWaitingCharges' },
      { label: 'Amount Paid', key: 'amountPaid' },
      { label: 'Transaction Amount Balance', key: 'transactionAmountBalance' },
      { label: 'Invoice No', key: 'invoiceNo' },
      { label: 'Invoice Date', key: 'invoiceDate' },
      { label: 'Remarks', key: 'remarks' },
      { label: 'Created Date', key: 'created' },
    ];

    // Map search results to match custom headers
    const formattedData = searchResults.map((result) =>
      headers.reduce((acc, header) => {
        acc[header.label] = result[header.key] || ''; // Use the key to fetch the value, default to empty string if missing
        return acc;
      }, {})
    );

    // Add headers to the CSV data
    const csv = Papa.unparse(formattedData);

    // Export the CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'trip_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardContainer>
      <ContentContainer>
        <Heading>Trip Information</Heading>

        <SearchBar>
          <InputWrapper>
            <InputLabel>Start Date</InputLabel>
            <Input type="date" name="fromDate" value={searchData.fromDate} onChange={handleSearchInputChange} />
          </InputWrapper>
          <InputWrapper>
            <InputLabel>End Date</InputLabel>
            <Input type="date" name="toDate" value={searchData.toDate} onChange={handleSearchInputChange} />
          </InputWrapper>
          <ButtonGroup>
            <Button color="#002985" onClick={handleSearchSubmit}><FaSearch /> Search</Button>
            {loggedIn && (
              <>
                <Button color="#002985" onClick={handleExport}><FaFileExport /> Export</Button>
                {userRole !== 'User' && (
                  <Button color="#28a745" onClick={openNewTab}><FaPlus /> Add New</Button>
                )}
              </>
            )}
          </ButtonGroup>
        </SearchBar>



        <RightSideContainer>
          {loading ? (
            <Loader />
          ) : (
            <TableWrapper>
              {currentRecords.length > 0 && (
                <StyledTable>
                  <StyledTableHead>
                    <TableRow>
                      <TableCell>Trip Date</TableCell>
                      <TableCell>Truck Plate Number</TableCell>
                      <TableCell>Truck Driver Name</TableCell>
                      <TableCell>Truck Category</TableCell>
                      <TableCell>Delivery Note</TableCell>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>C/O</TableCell>
                      <TableCell>First Loading</TableCell>
                      <TableCell>First Offloading</TableCell>
                      <TableCell>Second Loading</TableCell>
                      <TableCell>Second Offloading</TableCell>
                      <TableCell>Customer Rate</TableCell>
                      <TableCell>Customer Waiting Charges</TableCell>
                      <TableCell>Amount Received</TableCell>
                      <TableCell>Amount Balance</TableCell>
                      <TableCell>Driver Rate</TableCell>
                      <TableCell>Driver Waiting Charges</TableCell>
                      <TableCell>Amount Paid</TableCell>
                      <TableCell>Amount Balance</TableCell>
                      <TableCell>Invoice No</TableCell>
                      <TableCell>Invoice Date</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </StyledTableHead>
                  <StyledTableBody>
                    {currentRecords.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.tripDate}</TableCell>
                        <TableCell>{result.truckPlateNumber}</TableCell>
                        <TableCell>{result.truckDriverName}</TableCell>
                        <TableCell>{result.truckCategory}</TableCell>
                        <TableCell>{result.deliveryNote}</TableCell>
                        <TableCell>{result.customerName}</TableCell>
                        <TableCell>{result.cO}</TableCell>
                        <TableCell>{result.firstLoading}</TableCell>
                        <TableCell>{result.firstOffloading}</TableCell>
                        <TableCell>{result.secondLoading}</TableCell>
                        <TableCell>{result.secondOffloading}</TableCell>
                        <TableCell>{result.customerRate}</TableCell>
                        <TableCell>{result.customerWaitingCharges}</TableCell>
                        <TableCell>{result.amountReceived}</TableCell>
                        <TableCell>{result.amountBalance}</TableCell>
                        <TableCell>{result.driverRate}</TableCell>
                        <TableCell>{result.driverWaitingCharges}</TableCell>
                        <TableCell>{result.amountPaid}</TableCell>
                        <TableCell>{result.transactionAmountBalance}</TableCell>
                        <TableCell>{result.invoiceNo}</TableCell>
                        <TableCell>{result.invoiceDate}</TableCell>
                        <TableCell>{result.remarks}</TableCell>
                        <TableCell>{result.created}</TableCell>
                        <TableCell>
                          {userRole !== 'User' && ( // Only show buttons if the role is not 'User'
                            <>
                              <button
                                style={{
                                  padding: '5px 10px',
                                  marginRight: '5px',
                                  backgroundColor: '#002985',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleEdit(result)}
                              >
                                Edit
                              </button>
                              <button
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: '#dc3545',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleDelete(result.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </TableCell>

                      </TableRow>
                    ))}
                  </StyledTableBody>
                </StyledTable>
              )}
            </TableWrapper>
          )}
          <PaginationControls>
            <PaginationButton onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</PaginationButton>
            <span>Page {currentPage} of {totalPages}</span>
            <PaginationButton onClick={handleNextPage} disabled={currentPage === totalPages}>Next</PaginationButton>
          </PaginationControls>
        </RightSideContainer>



        <ToastContainer />
      </ContentContainer>
    </DashboardContainer>
  );
};

export default Dashboard;
