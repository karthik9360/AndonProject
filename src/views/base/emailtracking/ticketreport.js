import React from 'react';
import axios from 'axios';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CButton,
  CFormInput,
  CInputGroup,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CNav,
  CNavItem,
  CTooltip
} from '@coreui/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import BaseURL from 'src/assets/contants/BaseURL';

class TicketReport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tickets: [],
      filteredTickets: [],
      searchTerm: '',
      selectedTickets: [],
      selectAll: false,
    };
    this.tableRef = React.createRef();
  }

  componentDidMount() {
    this.fetchTickets();
  }

  componentDidUpdate(prevProps) {
    const { match } = this.props;
    if (match && match.params && prevProps.match && match.params.ticketId !== prevProps.match.params.ticketId) {
      this.scrollToTicket();
    }
  }

  fetchTickets = () => {
    axios.get(BaseURL + "emailtracking/reports/")
      .then(response => {
        const reversedData = response.data.reverse();
        this.setState({
          tickets: reversedData,
          filteredTickets: reversedData,
        });
      })
      .catch(error => {
        console.error('Error fetching tickets:', error);
      });
  }

  scrollToTicket = () => {
    const { match } = this.props;
    const { tickets } = this.state;
    const ticketId = parseInt(match.params.ticketId, 10);
    const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketId);
    if (ticketIndex !== -1) {
      const ticketElement = this.tableRef.current.querySelector(`#ticket-${ticketId}`);
      if (ticketElement) {
        ticketElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  handleSearchChange = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const { tickets } = this.state;

    const filteredTickets = tickets.filter(ticket =>
      ticket.date.toLowerCase().includes(searchTerm) ||
      ticket.time.toLowerCase().includes(searchTerm) ||
      ticket.message.toLowerCase().includes(searchTerm) ||
      ticket.Department.toLowerCase().includes(searchTerm) ||
      ticket.send_to_user.some(user =>
        user.username.toLowerCase().includes(searchTerm)
      )
    );

    this.setState({ filteredTickets, searchTerm });
  }

  handleCheckboxChange = (ticketId) => {
    const { selectedTickets } = this.state;
    const index = selectedTickets.indexOf(ticketId);
    let updatedSelectedTickets;
  
    if (index === -1) {
      updatedSelectedTickets = [...selectedTickets, ticketId];
    } else {
      updatedSelectedTickets = selectedTickets.filter(id => id !== ticketId);
    }
  
    this.setState({
      selectedTickets: updatedSelectedTickets,
    });
  }  

  handleSelectAll = () => {
    const { filteredTickets, selectAll } = this.state;
    if (selectAll) {
      this.setState({
        selectedTickets: [],
        selectAll: false,
      });
    } else {
      const allTicketIds = filteredTickets.map(ticket => ticket.id);
      this.setState({
        selectedTickets: allTicketIds,
        selectAll: true,
      });
    }
  }

  handleDeleteSelected = () => {
    const { selectedTickets } = this.state;
    if (selectedTickets.length === 0) {
      return;
    }
    selectedTickets.forEach(ticketId => {
      axios.delete(`${BaseURL}/emailtracking/reports/${ticketId}/`)
        .then(response => {
          console.log(`Ticket with ID ${ticketId} deleted successfully`);
          this.fetchTickets();
        })
        .catch(error => {
          console.error(`Error deleting ticket with ID ${ticketId}:`, error);
          alert(`Error deleting ticket with ID ${ticketId}: ${error.message}`);
        });
    });
    this.setState({
      selectedTickets: [],
      selectAll: false,
    });
  }  

  handleDownloadPDF = () => {
    const { filteredTickets } = this.state;
    const doc = new jsPDF();

    const tableColumn = ["Sl.No", "Date", "Time", "Message", "Department", "Send to User"];
    const tableRows = [];

    filteredTickets.forEach((ticket, index) => {
      const ticketData = [
        index + 1,
        ticket.date,
        ticket.time,
        ticket.message,
        ticket.Department,
        ticket.send_to_user.map(user => user.username).join(', ')
      ];
      tableRows.push(ticketData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("tickets_report.pdf");
  }

  render() {
    const { filteredTickets, searchTerm, selectedTickets, selectAll } = this.state;

    return (
      <>
        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>Report</strong>
                <CNav>
                  <CNavItem className="mx-2 position-relative">
                    <CTooltip content="Delete Selected Report">
                      <CButton type="button" color="primary" size='sm' onClick={this.handleDeleteSelected}>
                        Delete Selected
                      </CButton>
                    </CTooltip>
                  </CNavItem>
                </CNav>
              </CCardHeader>
              <CCardBody>
                <CCol md={4}>
                  <CInputGroup className="flex-nowrap mt-3 mb-4">
                    <CFormInput
                      placeholder="Search by Date, Time, Message, Department, Send to User"
                      aria-label="Search"
                      aria-describedby="addon-wrapping"
                      value={searchTerm}
                      onChange={this.handleSearchChange}
                    />
                    <CButton type="button" color="secondary" id="button-addon2">
                      Search
                    </CButton>
                  </CInputGroup>
                </CCol>
                <div id="pdf-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <CTable striped hover>
                    <CTableHead color='dark'>
                      <CTableRow>
                        <CTableHeaderCell>
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={this.handleSelectAll}
                          />
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col">Sl.No</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Time</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Message</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Department</CTableHeaderCell>
                        <CTableHeaderCell scope="col">Send to User</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody ref={this.tableRef}>
                      {filteredTickets.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan="7" className="text-center">No matching tickets found.</CTableDataCell>
                        </CTableRow>
                      ) : (
                        filteredTickets.map((ticket, index) => (
                          <CTableRow key={index} id={`ticket-${ticket.id}`}>
                            <CTableHeaderCell>
                              <input
                                type="checkbox"
                                checked={selectedTickets.includes(ticket.id)}
                                onChange={() => this.handleCheckboxChange(ticket.id)}
                              />
                            </CTableHeaderCell>
                            <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                            <CTableDataCell>{ticket.date}</CTableDataCell>
                            <CTableDataCell>{ticket.time}</CTableDataCell>
                            <CTableDataCell>{ticket.message}</CTableDataCell>
                            <CTableDataCell>{ticket.Department}</CTableDataCell>
                            <CTableDataCell>
                              {ticket.send_to_user.map(user => user.username).join(', ')}
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      )}
                    </CTableBody>
                  </CTable>
                </div>
                <CRow className="justify-content-center mt-4">
                  <CCol xs={1}>
                    <div className='d-grid gap-2'>
                      <CButton color="primary" type="button" onClick={this.handleDownloadPDF}>
                        Download
                      </CButton>
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </>
    );
  }
}

export default TicketReport;