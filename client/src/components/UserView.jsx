import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './UserView.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const UserView = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [impactAnalysis, setImpactAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'details', or 'impact'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Active', 'Inactive'

  useEffect(() => {
    fetchProjects();
    fetchImpactAnalysis();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchImpactAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/analysis/impact`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setImpactAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error fetching impact analysis:', error);
    }
  };

  // Filter projects based on status
  const getFilteredProjects = () => {
    if (statusFilter === 'all') return projects;
    return projects.filter(p => p.status === statusFilter);
  };

  const filteredProjects = getFilteredProjects();

  // Calculate overview statistics
  const getOverviewStats = () => {
    const totalProjects = filteredProjects.length;
    const activeProjectsList = projects.filter(p => p.status === 'Active');
    const inactiveProjectsList = projects.filter(p => p.status === 'Inactive');
    const activeProjects = activeProjectsList.length;
    const inactiveProjects = inactiveProjectsList.length;
    
    // Total calculations
    const totalIncome = filteredProjects.reduce((sum, p) => sum + (p.buyer?.summary?.totalReceived || 0), 0);
    const totalOutcome = filteredProjects.reduce((sum, p) => sum + (p.supplier?.summary?.totalAmount || 0), 0);
    const totalLoans = filteredProjects.reduce((sum, p) => sum + (p.supplier?.advancePayment?.loanAmount || 0), 0);
    const totalNetProfit = filteredProjects.reduce((sum, p) => sum + (p.costing?.netProfit || 0), 0);
    const totalTWLReceived = filteredProjects.reduce((sum, p) => sum + (p.buyer?.advancePayment?.twlReceived || 0) + (p.buyer?.balancePayment?.twlReceived || 0), 0);

    // Active projects calculations
    const activeIncome = activeProjectsList.reduce((sum, p) => sum + (p.buyer?.summary?.totalReceived || 0), 0);
    const activeOutcome = activeProjectsList.reduce((sum, p) => sum + (p.supplier?.summary?.totalAmount || 0), 0);
    const activeLoans = activeProjectsList.reduce((sum, p) => sum + (p.supplier?.advancePayment?.loanAmount || 0), 0);
    const activeNetProfit = activeProjectsList.reduce((sum, p) => sum + (p.costing?.netProfit || 0), 0);
    const activeTWLReceived = activeProjectsList.reduce((sum, p) => sum + (p.buyer?.advancePayment?.twlReceived || 0) + (p.buyer?.balancePayment?.twlReceived || 0), 0);

    // Inactive projects calculations
    const inactiveIncome = inactiveProjectsList.reduce((sum, p) => sum + (p.buyer?.summary?.totalReceived || 0), 0);
    const inactiveOutcome = inactiveProjectsList.reduce((sum, p) => sum + (p.supplier?.summary?.totalAmount || 0), 0);
    const inactiveLoans = inactiveProjectsList.reduce((sum, p) => sum + (p.supplier?.advancePayment?.loanAmount || 0), 0);
    const inactiveNetProfit = inactiveProjectsList.reduce((sum, p) => sum + (p.costing?.netProfit || 0), 0);
    const inactiveTWLReceived = inactiveProjectsList.reduce((sum, p) => sum + (p.buyer?.advancePayment?.twlReceived || 0) + (p.buyer?.balancePayment?.twlReceived || 0), 0);

    return {
      totalProjects,
      activeProjects,
      inactiveProjects,
      totalIncome,
      totalOutcome,
      totalLoans,
      totalNetProfit,
      totalTWLReceived,
      // Active project details
      activeIncome,
      activeOutcome,
      activeLoans,
      activeNetProfit,
      activeTWLReceived,
      // Inactive project details
      inactiveIncome,
      inactiveOutcome,
      inactiveLoans,
      inactiveNetProfit,
      inactiveTWLReceived
    };
  };

  // Get data for individual project
  const getProjectData = (project) => {
    if (!project) return null;

    return {
      income: project.buyer?.summary?.totalReceived || 0,
      outcome: project.supplier?.summary?.totalAmount || 0,
      loans: project.supplier?.advancePayment?.loanAmount || 0,
      twlReceived: (project.buyer?.advancePayment?.twlReceived || 0) + (project.buyer?.balancePayment?.twlReceived || 0),
      netProfit: project.costing?.netProfit || 0,
      expenses: {
        inGoing: project.costing?.inGoing || 0,
        outGoing: project.costing?.outGoing || 0,
        calCharges: project.costing?.calCharges || 0,
        other: project.costing?.other || 0,
        foreignBankCharges: project.costing?.foreignBankCharges || 0,
        loanInterest: project.costing?.loanInterest || 0,
        freightCharges: project.costing?.freightCharges || 0,
      }
    };
  };

  // Overview Chart - All Projects Net Profit
  const getOverviewChartData = () => {
    return {
      labels: filteredProjects.map(p => p.projectNo),
      datasets: [
        {
          label: 'Net Profit',
          data: filteredProjects.map(p => p.costing?.netProfit || 0),
          backgroundColor: filteredProjects.map(p => (p.costing?.netProfit || 0) >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
          borderColor: filteredProjects.map(p => (p.costing?.netProfit || 0) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
          borderWidth: 2,
        },
      ],
    };
  };

  // Detailed Financial Breakdown Chart for Each Project
  const getDetailedFinancialChart = (projectData, project) => {
    if (!projectData) return null;

    return {
      labels: ['Supplier Invoice', 'TWL Invoice', 'Total Expenses', 'Net Profit'],
      datasets: [
        {
          label: 'Financial Breakdown ($)',
          data: [
            project.costing?.supplierInvoiceAmount || 0,
            project.costing?.twlInvoiceAmount || 0,
            (projectData.expenses.inGoing + projectData.expenses.outGoing + 
             projectData.expenses.calCharges + projectData.expenses.other + 
             projectData.expenses.foreignBankCharges + projectData.expenses.loanInterest + 
             projectData.expenses.freightCharges),
            projectData.netProfit
          ],
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(251, 191, 36, 0.7)',
            projectData.netProfit >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(220, 38, 38, 0.7)'
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(59, 130, 246)',
            'rgb(251, 191, 36)',
            projectData.netProfit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(220, 38, 38)'
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Project Financial Overview Chart
  const getProjectFinancialChart = (projectData) => {
    if (!projectData) return null;

    return {
      labels: ['Income', 'Outcome', 'Loans', 'TWL Received', 'Net Profit'],
      datasets: [
        {
          label: 'Amount ($)',
          data: [
            projectData.income,
            projectData.outcome,
            projectData.loans,
            projectData.twlReceived,
            projectData.netProfit
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(251, 191, 36, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            projectData.netProfit >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(220, 38, 38, 0.7)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(239, 68, 68)',
            'rgb(251, 191, 36)',
            'rgb(34, 197, 94)',
            projectData.netProfit >= 0 ? 'rgb(16, 185, 129)' : 'rgb(220, 38, 38)'
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Expenses Breakdown Pie Chart
  const getExpensesChart = (projectData) => {
    if (!projectData) return null;

    const expenseValues = Object.values(projectData.expenses);
    const totalExpenses = expenseValues.reduce((sum, val) => sum + val, 0);
    
    if (totalExpenses === 0) return null;

    return {
      labels: ['In Going', 'Out Going', 'CAL Charges', 'Other', 'Foreign Bank', 'Loan Interest', 'Freight'],
      datasets: [
        {
          label: 'Expenses ($)',
          data: expenseValues,
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(251, 191, 36, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(14, 165, 233, 0.7)',
            'rgba(99, 102, 241, 0.7)',
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(249, 115, 22)',
            'rgb(251, 191, 36)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
            'rgb(14, 165, 233)',
            'rgb(99, 102, 241)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Income vs Outcome Trend
  const getIncomeOutcomeTrend = () => {
    const sortedProjects = [...filteredProjects].sort((a, b) => 
      new Date(a.projectDate) - new Date(b.projectDate)
    );

    return {
      labels: sortedProjects.map(p => p.projectNo),
      datasets: [
        {
          label: 'Income',
          data: sortedProjects.map(p => p.buyer?.summary?.totalReceived || 0),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.4,
        },
        {
          label: 'Outcome',
          data: sortedProjects.map(p => p.supplier?.summary?.totalAmount || 0),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += '$' + context.parsed.y.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const stats = getOverviewStats();

  if (loading) {
    return (
      <div className="user-view-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-view-container">
      <nav className="user-nav">
        <div className="nav-brand">
          <h2>📊 TWL System - Analytics</h2>
        </div>
        <div className="nav-user">
          <span className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">User</span>
          </span>
          <button onClick={onLogout} className="logout-button">
            <span>Logout</span>
            <span className="logout-icon">→</span>
          </button>
        </div>
      </nav>

      <div className="user-content">
        <div className="welcome-section">
          <h1>Project Analytics Dashboard 📈</h1>
          <p>View financial insights and project performance</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'details' ? 'active' : ''}`}
            onClick={() => setViewMode('details')}
          >
            📋 All Project Details
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'impact' ? 'active' : ''}`}
            onClick={() => setViewMode('impact')}
          >
            💡 Impact Analysis
          </button>
        </div>

        {/* Status Filter */}
        <div className="status-filter-section">
          <h3>Filter by Status:</h3>
          <div className="status-filter-buttons">
            <button 
              className={`filter-status-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              📊 All Projects ({projects.length})
            </button>
            <button 
              className={`filter-status-btn status-active-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              ✓ Active ({stats.activeProjects})
            </button>
            <button 
              className={`filter-status-btn status-inactive-btn ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              ✕ Inactive ({stats.inactiveProjects})
            </button>
          </div>
        </div>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <h3>Total Projects</h3>
                  <p className="stat-value">{stats.totalProjects}</p>
                  <small className="stat-subtitle">Displaying {filteredProjects.length} projects</small>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <h3>Active Projects</h3>
                  <p className="stat-value">{stats.activeProjects}</p>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-icon">✕</div>
                <div className="stat-content">
                  <h3>Inactive Projects</h3>
                  <p className="stat-value">{stats.inactiveProjects}</p>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Total Income</h3>
                  <p className="stat-value">${stats.totalIncome.toFixed(2)}</p>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-icon">💸</div>
                <div className="stat-content">
                  <h3>Total Outcome</h3>
                  <p className="stat-value">${stats.totalOutcome.toFixed(2)}</p>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">🏦</div>
                <div className="stat-content">
                  <h3>Total Loans</h3>
                  <p className="stat-value">${stats.totalLoans.toFixed(2)}</p>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📥</div>
                <div className="stat-content">
                  <h3>TWL Received</h3>
                  <p className="stat-value">${stats.totalTWLReceived.toFixed(2)}</p>
                </div>
              </div>

              <div className={`stat-card ${stats.totalNetProfit >= 0 ? 'success' : 'danger'}`}>
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Net Profit</h3>
                  <p className="stat-value">${stats.totalNetProfit.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Active vs Inactive Projects Breakdown */}
            <div className="breakdown-section">
              <h3 className="breakdown-title">📊 Active vs Inactive Projects Breakdown</h3>
              
              <div className="breakdown-grid">
                {/* Active Projects Column */}
                <div className="breakdown-column active-column">
                  <div className="breakdown-header">
                    <h4>✓ Active Projects ({stats.activeProjects})</h4>
                  </div>
                  <div className="breakdown-stats">
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">💰 Income</span>
                      <span className="breakdown-value success">${stats.activeIncome.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">💸 Outcome</span>
                      <span className="breakdown-value danger">${stats.activeOutcome.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">🏦 Loans</span>
                      <span className="breakdown-value warning">${stats.activeLoans.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">📥 TWL Received</span>
                      <span className="breakdown-value info">${stats.activeTWLReceived.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item highlight">
                      <span className="breakdown-label">📈 Net Profit</span>
                      <span className={`breakdown-value ${stats.activeNetProfit >= 0 ? 'success' : 'danger'}`}>
                        ${stats.activeNetProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inactive Projects Column */}
                <div className="breakdown-column inactive-column">
                  <div className="breakdown-header">
                    <h4>✕ Inactive Projects ({stats.inactiveProjects})</h4>
                  </div>
                  <div className="breakdown-stats">
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">💰 Income</span>
                      <span className="breakdown-value success">${stats.inactiveIncome.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">💸 Outcome</span>
                      <span className="breakdown-value danger">${stats.inactiveOutcome.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">🏦 Loans</span>
                      <span className="breakdown-value warning">${stats.inactiveLoans.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">📥 TWL Received</span>
                      <span className="breakdown-value info">${stats.inactiveTWLReceived.toFixed(2)}</span>
                    </div>
                    <div className="breakdown-stat-item highlight">
                      <span className="breakdown-label">📈 Net Profit</span>
                      <span className={`breakdown-value ${stats.inactiveNetProfit >= 0 ? 'success' : 'danger'}`}>
                        ${stats.inactiveNetProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Values Column (Active - Inactive) */}
                <div className="breakdown-column net-column">
                  <div className="breakdown-header">
                    <h4>💼 Net Values (Active - Inactive)</h4>
                  </div>
                  <div className="breakdown-stats">
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">💰 Income</span>
                      <span className={`breakdown-value ${(stats.activeIncome - stats.inactiveIncome) >= 0 ? 'success' : 'danger'}`}>
                        ${(stats.activeIncome - stats.inactiveIncome).toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">💸 Outcome</span>
                      <span className={`breakdown-value ${(stats.activeOutcome - stats.inactiveOutcome) >= 0 ? 'danger' : 'success'}`}>
                        ${(stats.activeOutcome - stats.inactiveOutcome).toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">🏦 Loans</span>
                      <span className="breakdown-value warning">
                        ${(stats.activeLoans - stats.inactiveLoans).toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-stat-item">
                      <span className="breakdown-label">📥 TWL Received</span>
                      <span className="breakdown-value info">
                        ${(stats.activeTWLReceived - stats.inactiveTWLReceived).toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-stat-item highlight">
                      <span className="breakdown-label">📈 Net Profit</span>
                      <span className={`breakdown-value ${(stats.activeNetProfit - stats.inactiveNetProfit) >= 0 ? 'success' : 'danger'}`}>
                        ${(stats.activeNetProfit - stats.inactiveNetProfit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Charts */}
            <div className="charts-section">
              <div className="chart-card full-width">
                <h3>All Projects Net Profit</h3>
                <div className="chart-container">
                  <Bar data={getOverviewChartData()} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card full-width">
                <h3>Income vs Outcome Trend</h3>
                <div className="chart-container">
                  <Line data={getIncomeOutcomeTrend()} options={chartOptions} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Project Details Mode - All Projects */}
        {viewMode === 'details' && (
          <>
            <div className="projects-details-section">
              <h2>All Projects Financial Details 📋</h2>
              
              {filteredProjects.length === 0 ? (
                <div className="no-projects">
                  <p>📭 No projects found</p>
                </div>
              ) : (
                <div className="projects-details-grid">
                  {filteredProjects.map((project) => {
                    const projectData = getProjectData(project);
                    return (
                      <div key={project._id} className="project-detail-card">
                        {/* Project Header */}
                        <div className="project-header">
                          <div className="header-left">
                            <h3>{project.projectName}</h3>
                            <span className={`status-badge ${project.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              {project.status === 'Active' ? '✓ Active' : '✕ Inactive'}
                            </span>
                          </div>
                          <div className="project-meta">
                            <span><strong>Project No:</strong> {project.projectNo}</span>
                            <span><strong>Date:</strong> {new Date(project.projectDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Supplier & Buyer Info */}
                        <div className="project-parties">
                          <div className="party-info">
                            <span><strong>🏭 Supplier:</strong> {project.supplier?.proformaInvoice?.supplierName || 'N/A'}</span>
                            <span><strong>🛒 Buyer:</strong> {project.buyer?.proformaInvoice?.buyerName || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Financial Summary Cards */}
                        <div className="project-stats-grid">
                          <div className="stat-item">
                            <div className="stat-label">💰 Income</div>
                            <div className="stat-value success">${projectData.income.toFixed(2)}</div>
                          </div>
                          
                          <div className="stat-item">
                            <div className="stat-label">💸 Outcome</div>
                            <div className="stat-value danger">${projectData.outcome.toFixed(2)}</div>
                          </div>
                          
                          <div className="stat-item">
                            <div className="stat-label">🏦 Loans</div>
                            <div className="stat-value warning">${projectData.loans.toFixed(2)}</div>
                          </div>
                          
                          <div className="stat-item">
                            <div className="stat-label">📥 TWL Received</div>
                            <div className="stat-value info">${projectData.twlReceived.toFixed(2)}</div>
                          </div>
                          
                          <div className="stat-item full-width">
                            <div className="stat-label">📈 Net Profit</div>
                            <div className={`stat-value ${projectData.netProfit >= 0 ? 'success' : 'danger'}`}>
                              ${projectData.netProfit.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Supplier Details */}
                        <div className="section-details">
                          <h4>🏭 Supplier Details</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span>Invoice Amount:</span>
                              <span>${project.supplier?.proformaInvoice?.invoiceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Credit Note:</span>
                              <span>${project.supplier?.proformaInvoice?.creditNote?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Final Invoice:</span>
                              <span>${project.supplier?.proformaInvoice?.finalInvoiceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Advance Payment:</span>
                              <span>${project.supplier?.advancePayment?.totalPayment?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Balance Payment:</span>
                              <span>${project.supplier?.balancePayment?.totalPayment?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Total Amount:</span>
                              <span>${project.supplier?.summary?.totalAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Buyer Details */}
                        <div className="section-details">
                          <h4>🛒 Buyer Details</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span>TWL Invoice Amount:</span>
                              <span>${project.buyer?.proformaInvoice?.twlInvoiceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Final Invoice:</span>
                              <span>${project.buyer?.proformaInvoice?.finalInvoiceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Advance Received:</span>
                              <span>${project.buyer?.advancePayment?.twlReceived?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Balance Received:</span>
                              <span>${project.buyer?.balancePayment?.twlReceived?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Total Received:</span>
                              <span>${project.buyer?.summary?.totalReceived?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Costing Details */}
                        <div className="section-details">
                          <h4>💰 Costing & Profit</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span>Supplier Invoice:</span>
                              <span>${project.costing?.supplierInvoiceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>TWL Invoice:</span>
                              <span>${project.costing?.twlInvoiceAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Gross Profit:</span>
                              <span>${project.costing?.profit?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="detail-item">
                              <span>Total Expenses:</span>
                              <span>${(project.costing?.inGoing + project.costing?.outGoing + project.costing?.calCharges + project.costing?.other + project.costing?.foreignBankCharges + project.costing?.loanInterest + project.costing?.freightCharges || 0).toFixed(2)}</span>
                            </div>
                            <div className="detail-item full-width">
                              <span><strong>Net Profit:</strong></span>
                              <span className={`profit-highlight ${projectData.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                <strong>${projectData.netProfit.toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Financial Breakdown Chart */}
                        <div className="project-financial-chart">
                          <h4>📊 Financial Breakdown</h4>
                          <div className="chart-container medium">
                            <Bar 
                              data={getDetailedFinancialChart(projectData, project)} 
                              options={{
                                ...chartOptions,
                                plugins: {
                                  ...chartOptions.plugins,
                                  legend: { display: false },
                                  title: {
                                    display: true,
                                    text: 'Financial Components ($)'
                                  }
                                }
                              }} 
                            />
                          </div>
                        </div>

                        {/* Expenses Pie Chart */}
                        {getExpensesChart(projectData) && (
                          <div className="project-expenses-chart">
                            <h4>💰 Expenses Breakdown</h4>
                            <div className="chart-container medium">
                              <Pie 
                                data={getExpensesChart(projectData)} 
                                options={pieChartOptions} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Impact Analysis Mode */}
        {viewMode === 'impact' && impactAnalysis && (
          <>
            <div className="impact-analysis-section">
              <h2>📊 Company Impact Analysis</h2>
              <p className="section-description">
                Comprehensive analysis of how each project contributes to company performance
              </p>

              {/* Company-Wide Metrics */}
              <div className="company-metrics-section">
                <h3>🏢 Company-Wide Metrics</h3>
                <div className="stats-grid">
                  <div className="stat-card primary">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                      <h4>Total Revenue</h4>
                      <p className="stat-value">${impactAnalysis.companyMetrics.totalRevenue.toFixed(2)}</p>
                      <small>Active: ${impactAnalysis.companyMetrics.activeRevenue.toFixed(2)}</small>
                    </div>
                  </div>

                  <div className="stat-card success">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <h4>Total Net Profit</h4>
                      <p className={`stat-value ${impactAnalysis.companyMetrics.totalProfit >= 0 ? 'success' : 'danger'}`}>
                        ${impactAnalysis.companyMetrics.totalProfit.toFixed(2)}
                      </p>
                      <small>Active: ${impactAnalysis.companyMetrics.activeProfit.toFixed(2)}</small>
                    </div>
                  </div>

                  <div className="stat-card info">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <h4>Average ROI</h4>
                      <p className="stat-value">{impactAnalysis.companyMetrics.averageROI.toFixed(2)}%</p>
                      <small>Return on Investment</small>
                    </div>
                  </div>

                  <div className="stat-card warning">
                    <div className="stat-icon">💼</div>
                    <div className="stat-content">
                      <h4>Profit Margin</h4>
                      <p className="stat-value">{impactAnalysis.companyMetrics.averageProfitMargin.toFixed(2)}%</p>
                      <small>Average across projects</small>
                    </div>
                  </div>

                  <div className="stat-card danger">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                      <h4>Risk Exposure</h4>
                      <p className="stat-value">${impactAnalysis.companyMetrics.totalRiskExposure.toFixed(2)}</p>
                      <small>{impactAnalysis.companyMetrics.riskAssessment.highRiskCount} High Risk Projects</small>
                    </div>
                  </div>

                  <div className={`stat-card ${impactAnalysis.companyMetrics.companyHealth === 'Healthy' ? 'success' : 'warning'}`}>
                    <div className="stat-icon">🏥</div>
                    <div className="stat-content">
                      <h4>Company Health</h4>
                      <p className="stat-value">{impactAnalysis.companyMetrics.companyHealth}</p>
                      <small>Impact Score: {impactAnalysis.companyMetrics.averageImpactScore.toFixed(2)}</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="top-performers-section">
                <h3>🏆 Top Performing Projects</h3>
                <div className="performers-grid">
                  <div className="performers-card">
                    <h4>💰 By Net Profit</h4>
                    <div className="performers-list">
                      {impactAnalysis.companyMetrics.topPerformers.byProfit.map((project, index) => (
                        <div key={index} className="performer-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="project-info">
                            <strong>{project.projectNo}</strong> - {project.projectName}
                          </span>
                          <span className="performer-value success">
                            ${project.netProfit.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="performers-card">
                    <h4>📊 By Impact Score</h4>
                    <div className="performers-list">
                      {impactAnalysis.companyMetrics.topPerformers.byImpact.map((project, index) => (
                        <div key={index} className="performer-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="project-info">
                            <strong>{project.projectNo}</strong> - {project.projectName}
                          </span>
                          <span className="performer-value info">
                            {project.impactScore.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* High Risk Projects */}
              {impactAnalysis.companyMetrics.riskAssessment.highRiskProjects.length > 0 && (
                <div className="risk-projects-section">
                  <h3>⚠️ High Risk Projects</h3>
                  <div className="risk-list">
                    {impactAnalysis.companyMetrics.riskAssessment.highRiskProjects.map((project, index) => (
                      <div key={index} className={`risk-item risk-${project.riskLevel.toLowerCase()}`}>
                        <div className="risk-header">
                          <span className="project-info">
                            <strong>{project.projectNo}</strong> - {project.projectName}
                          </span>
                          <span className={`risk-badge ${project.riskLevel.toLowerCase()}`}>
                            {project.riskLevel} Risk
                          </span>
                        </div>
                        <div className="risk-score">
                          Risk Score: <strong>{project.riskScore.toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Project Impact Analysis */}
              <div className="project-impact-section">
                <h3>📋 Individual Project Impact Analysis</h3>
                
                {/* Filter by status */}
                <div className="impact-filter">
                  <label>Filter by Status:</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Projects</option>
                    <option value="Active">Active Only</option>
                    <option value="Inactive">Inactive Only</option>
                  </select>
                </div>

                <div className="impact-projects-grid">
                  {impactAnalysis.projects
                    .filter(p => statusFilter === 'all' || p.status === statusFilter)
                    .map((project) => (
                    <div key={project.projectId} className="impact-project-card">
                      {/* Project Header */}
                      <div className="project-header">
                        <div className="header-left">
                          <h4>{project.projectName}</h4>
                          <span className={`status-badge ${project.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                            {project.status === 'Active' ? '✓ Active' : '✕ Inactive'}
                          </span>
                        </div>
                        <div className="project-meta">
                          <span className="project-no">{project.projectNo}</span>
                          <span className="project-age">{project.metrics.projectAge} days old</span>
                        </div>
                      </div>

                      {/* Impact Score Card */}
                      <div className={`impact-score-card ${
                        project.metrics.impactLevel === 'Very Positive' ? 'very-positive' :
                        project.metrics.impactLevel === 'Positive' ? 'positive' :
                        project.metrics.impactLevel === 'Negative' ? 'negative' : 'neutral'
                      }`}>
                        <div className="impact-label">Company Impact</div>
                        <div className="impact-value">{project.metrics.impactScore.toFixed(2)}</div>
                        <div className="impact-level">{project.metrics.impactLevel}</div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="impact-metrics-grid">
                        <div className="metric-item">
                          <div className="metric-label">ROI</div>
                          <div className={`metric-value ${project.metrics.roi >= 0 ? 'positive' : 'negative'}`}>
                            {project.metrics.roi.toFixed(2)}%
                          </div>
                        </div>

                        <div className="metric-item">
                          <div className="metric-label">Profit Margin</div>
                          <div className={`metric-value ${project.metrics.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                            {project.metrics.profitMargin.toFixed(2)}%
                          </div>
                        </div>

                        <div className="metric-item">
                          <div className="metric-label">Efficiency</div>
                          <div className={`metric-value ${project.metrics.efficiencyScore >= 0 ? 'positive' : 'negative'}`}>
                            {project.metrics.efficiencyScore.toFixed(2)}
                          </div>
                        </div>

                        <div className="metric-item">
                          <div className="metric-label">Risk Level</div>
                          <div className={`metric-value risk-${project.metrics.riskLevel.toLowerCase()}`}>
                            {project.metrics.riskLevel}
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="impact-financial">
                        <h5>💰 Financial Summary</h5>
                        <div className="financial-items">
                          <div className="financial-item">
                            <span>Revenue:</span>
                            <span className="success">${project.financial.revenue.toFixed(2)}</span>
                          </div>
                          <div className="financial-item">
                            <span>Cost:</span>
                            <span className="danger">${project.financial.cost.toFixed(2)}</span>
                          </div>
                          <div className="financial-item">
                            <span>Net Profit:</span>
                            <span className={project.financial.netProfit >= 0 ? 'success' : 'danger'}>
                              ${project.financial.netProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="financial-item">
                            <span>Investment:</span>
                            <span className="warning">${project.financial.investment.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contribution to Company */}
                      <div className="impact-contribution">
                        <h5>📊 Contribution to Company</h5>
                        <div className="contribution-bars">
                          <div className="contribution-item">
                            <span className="contribution-label">Revenue Share:</span>
                            <div className="contribution-bar-container">
                              <div 
                                className="contribution-bar revenue" 
                                style={{width: `${Math.min(project.contribution.revenuePercentage, 100)}%`}}
                              ></div>
                            </div>
                            <span className="contribution-value">{project.contribution.revenuePercentage.toFixed(1)}%</span>
                          </div>

                          <div className="contribution-item">
                            <span className="contribution-label">Profit Share:</span>
                            <div className="contribution-bar-container">
                              <div 
                                className={`contribution-bar ${project.contribution.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}
                                style={{width: `${Math.min(Math.abs(project.contribution.profitPercentage), 100)}%`}}
                              ></div>
                            </div>
                            <span className="contribution-value">{project.contribution.profitPercentage.toFixed(1)}%</span>
                          </div>

                          <div className="contribution-item">
                            <span className="contribution-label">Cost Share:</span>
                            <div className="contribution-bar-container">
                              <div 
                                className="contribution-bar cost" 
                                style={{width: `${Math.min(project.contribution.costPercentage, 100)}%`}}
                              ></div>
                            </div>
                            <span className="contribution-value">{project.contribution.costPercentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Parties Info */}
                      <div className="impact-parties">
                        <div className="party-item">
                          <span>🏭 Supplier:</span>
                          <span>{project.supplier}</span>
                        </div>
                        <div className="party-item">
                          <span>🛒 Buyer:</span>
                          <span>{project.buyer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {projects.length === 0 && (
          <div className="no-projects">
            <p>📭 No projects found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserView;