import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Trash2, Eye, ArrowLeft, FileText, Calendar, Upload, X } from 'lucide-react';
import api from '../services/api';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { API_CONFIG } from '../config/api';

interface EmployeeDocument {
  id: number;
  staff_id: number;
  file_name: string;
  file_url: string;
  description: string;
  uploaded_at: string;
}

interface EmployeeContract {
  id: number;
  staff_id: number;
  file_name: string;
  file_url: string;
  start_date: string;
  end_date: string;
  renewed_from: number | null;
  uploaded_at: string;
}

interface TerminationLetter {
  id: number;
  staff_id: number;
  file_name: string;
  file_url: string;
  termination_date: string;
  uploaded_at: string;
}

interface WarningLetter {
  id: number;
  staff_id: number;
  file_name: string;
  file_url: string;
  warning_date: string;
  warning_type: string;
  description: string;
  uploaded_at: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  empl_no: string;
}

const EmployeeDocumentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const staffId = searchParams.get('staff_id');
  const staffName = searchParams.get('staff_name');

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [terminationLetters, setTerminationLetters] = useState<TerminationLetter[]>([]);
  const [warningLetters, setWarningLetters] = useState<WarningLetter[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<number | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingTermination, setUploadingTermination] = useState(false);
  const [uploadingWarning, setUploadingWarning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractForm, setContractForm] = useState({
    start_date: '',
    end_date: '',
    file: null as File | null,
  });
  const [documentForm, setDocumentForm] = useState({
    description: '',
    file: null as File | null,
  });
  const [terminationForm, setTerminationForm] = useState({
    termination_date: '',
    file: null as File | null,
  });
  const [warningForm, setWarningForm] = useState({
    warning_date: '',
    warning_type: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (!staffId) {
      setError('No employee ID provided');
      setLoading(false);
      return;
    }

    fetchEmployeeData();
    fetchDocuments();
    fetchContracts();
    fetchTerminationLetters();
    fetchWarningLetters();
  }, [staffId]);

  const fetchEmployeeData = async () => {
    try {
      const response = await api.get(`/staff/${staffId}`);
      setEmployee(response.data);
    } catch (err) {
      console.error('Error fetching employee data:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/staff/${staffId}/documents`);
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    console.log('Fetching contracts for staff ID:', staffId);
    try {
      const response = await api.get(`/staff/${staffId}/contracts`);
      console.log('Contracts data:', response.data);
      setContracts(response.data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    }
  };

  const fetchTerminationLetters = async () => {
    console.log('Fetching termination letters for staff ID:', staffId);
    try {
      const response = await api.get(`/staff/${staffId}/termination-letters`);
      console.log('Termination letters data:', response.data);
      setTerminationLetters(response.data);
    } catch (err) {
      console.error('Error fetching termination letters:', err);
    }
  };

  const fetchWarningLetters = async () => {
    console.log('Fetching warning letters for staff ID:', staffId);
    try {
      const response = await api.get(`/staff/${staffId}/warning-letters`);
      console.log('Warning letters data:', response.data);
      setWarningLetters(response.data);
    } catch (err) {
      console.error('Error fetching warning letters:', err);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setDeletingDoc(docId);
      await api.delete(`/staff/documents/${docId}`);
      setDocuments(docs => docs.filter(doc => doc.id !== docId));
    } catch (err) {
      alert('Failed to delete document');
    } finally {
      setDeletingDoc(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleTerminationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTerminationForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleWarningFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWarningForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Contract upload started');
    console.log('Form data:', contractForm);
    console.log('Staff ID:', staffId);
    
    if (!contractForm.file || !contractForm.start_date || !contractForm.end_date) {
      console.log('Validation failed - missing required fields');
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploadingContract(true);
      const formData = new FormData();
      formData.append('file', contractForm.file);
      formData.append('start_date', contractForm.start_date);
      formData.append('end_date', contractForm.end_date);

      console.log('Sending request to:', `/api/staff/${staffId}/contracts`);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetchWithAuth(API_CONFIG.getUrl(`/staff/${staffId}/contracts`), {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        alert('Contract uploaded successfully!');
        setIsContractModalOpen(false);
        setContractForm({ start_date: '', end_date: '', file: null });
        fetchContracts(); // Refresh contracts list
      } else {
        const errorData = await response.text();
        console.log('Upload failed - Response:', errorData);
        alert(`Failed to upload contract: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload contract: ${err}`);
    } finally {
      setUploadingContract(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Document upload started');
    console.log('Form data:', documentForm);
    console.log('Staff ID:', staffId);
    
    if (!documentForm.file) {
      console.log('Validation failed - no file selected');
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append('file', documentForm.file);
      if (documentForm.description) {
        formData.append('description', documentForm.description);
      }

      console.log('Sending request to:', `/api/staff/${staffId}/documents`);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetchWithAuth(API_CONFIG.getUrl(`/staff/${staffId}/documents`), {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        alert('Document uploaded successfully!');
        setIsDocumentModalOpen(false);
        setDocumentForm({ description: '', file: null });
        fetchDocuments(); // Refresh documents list
      } else {
        const errorData = await response.text();
        console.log('Upload failed - Response:', errorData);
        alert(`Failed to upload document: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload document: ${err}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleUploadTermination = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Termination letter upload started');
    console.log('Form data:', terminationForm);
    console.log('Staff ID:', staffId);
    
    if (!terminationForm.file || !terminationForm.termination_date) {
      console.log('Validation failed - missing required fields');
      alert('Please select a file and enter termination date');
      return;
    }

    if (!window.confirm('Are you sure you want to upload a termination letter? This will deactivate the employee.')) {
      return;
    }

    try {
      setUploadingTermination(true);
      const formData = new FormData();
      formData.append('file', terminationForm.file);
      formData.append('termination_date', terminationForm.termination_date);

      console.log('Sending request to:', `/api/staff/${staffId}/termination-letters`);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetchWithAuth(API_CONFIG.getUrl(`/staff/${staffId}/termination-letters`), {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        alert('Termination letter uploaded successfully! Employee has been deactivated.');
        setIsTerminationModalOpen(false);
        setTerminationForm({ termination_date: '', file: null });
        fetchTerminationLetters(); // Refresh termination letters list
        fetchEmployeeData(); // Refresh employee data to show updated status
      } else {
        const errorData = await response.text();
        console.log('Upload failed - Response:', errorData);
        alert(`Failed to upload termination letter: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload termination letter: ${err}`);
    } finally {
      setUploadingTermination(false);
    }
  };

  const handleUploadWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Warning letter upload started');
    console.log('Form data:', warningForm);
    console.log('Staff ID:', staffId);
    
    if (!warningForm.file || !warningForm.warning_date || !warningForm.warning_type) {
      console.log('Validation failed - missing required fields');
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploadingWarning(true);
      const formData = new FormData();
      formData.append('file', warningForm.file);
      formData.append('warning_date', warningForm.warning_date);
      formData.append('warning_type', warningForm.warning_type);
      if (warningForm.description) {
        formData.append('description', warningForm.description);
      }

      console.log('Sending request to:', `/api/staff/${staffId}/warning-letters`);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetchWithAuth(API_CONFIG.getUrl(`/staff/${staffId}/warning-letters`), {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        alert('Warning letter uploaded successfully!');
        setIsWarningModalOpen(false);
        setWarningForm({ warning_date: '', warning_type: '', description: '', file: null });
        fetchWarningLetters(); // Refresh warning letters list
      } else {
        const errorData = await response.text();
        console.log('Upload failed - Response:', errorData);
        alert(`Failed to upload warning letter: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload warning letter: ${err}`);
    } finally {
      setUploadingWarning(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word Document';
      case 'xls':
      case 'xlsx': return 'Excel Spreadsheet';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'Image';
      case 'txt': return 'Text File';
      default: return 'Other';
    }
  };

  const filterDocuments = (docs: EmployeeDocument[]) => {
    if (!searchTerm.trim()) return docs;
    
    const searchLower = searchTerm.toLowerCase();
    return docs.filter(doc => {
      const fileName = doc.file_name.toLowerCase();
      const description = (doc.description || '').toLowerCase();
      const fileType = getFileType(doc.file_name).toLowerCase();
      
      return fileName.includes(searchLower) || 
             description.includes(searchLower) || 
             fileType.includes(searchLower);
    });
  };

  const filteredDocuments = filterDocuments(documents);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/dashboard/staff-list')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Staff List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard/staff-list')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Employee Documents
                  </h1>
                  <p className="text-gray-600">
                    {employee?.name || staffName} - {employee?.role || 'Employee'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsDocumentModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload New Document
                </button>
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contract
                </button>
                <button
                  onClick={() => setIsTerminationModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Termination Letter
                </button>
                <button
                  onClick={() => setIsWarningModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Warning Letter
                </button>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          {employee && (
            <div className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Employee Name</span>
                  <p className="text-sm text-gray-900">{employee.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Role</span>
                  <p className="text-sm text-gray-900">{employee.role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Employee Number</span>
                  <p className="text-sm text-gray-900">{employee.empl_no}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contracts List */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Employee Contracts ({contracts.length})
            </h2>
          </div>

          {contracts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts</h3>
              <p className="mt-1 text-sm text-gray-500">
                No contracts have been uploaded for this employee yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Contract
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">📄</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contract.file_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contract.file_url.includes('cloudinary') ? 'Cloud Storage' : 'Local Storage'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contract.start_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contract.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(contract.uploaded_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={contract.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Contract"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={contract.file_url}
                            download={contract.file_name}
                            className="text-green-600 hover:text-green-900"
                            title="Download Contract"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Termination Letters List */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Termination Letters ({terminationLetters.length})
            </h2>
          </div>

          {terminationLetters.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No termination letters</h3>
              <p className="mt-1 text-sm text-gray-500">
                No termination letters have been uploaded for this employee yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsTerminationModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Termination Letter
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Termination Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Termination Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {terminationLetters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">📄</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {letter.file_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {letter.file_url.includes('cloudinary') ? 'Cloud Storage' : 'Local Storage'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(letter.termination_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(letter.uploaded_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={letter.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Termination Letter"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={letter.file_url}
                            download={letter.file_name}
                            className="text-green-600 hover:text-green-900"
                            title="Download Termination Letter"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Warning Letters List */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Warning Letters ({warningLetters.length})
            </h2>
          </div>

          {warningLetters.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No warning letters</h3>
              <p className="mt-1 text-sm text-gray-500">
                No warning letters have been uploaded for this employee yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsWarningModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Warning Letter
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warning Letter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warning Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warning Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {warningLetters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">📄</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {letter.file_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {letter.file_url.includes('cloudinary') ? 'Cloud Storage' : 'Local Storage'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          letter.warning_type === 'First Warning' ? 'bg-yellow-100 text-yellow-800' :
                          letter.warning_type === 'Second Warning' ? 'bg-orange-100 text-orange-800' :
                          letter.warning_type === 'Final Warning' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {letter.warning_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(letter.warning_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {letter.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(letter.uploaded_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={letter.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Warning Letter"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={letter.file_url}
                            download={letter.file_name}
                            className="text-green-600 hover:text-green-900"
                            title="Download Warning Letter"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Other Documents ({filteredDocuments.length} of {documents.length})
              </h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search documents by name, type, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No matching documents' : 'No documents'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `No documents found matching "${searchTerm}". Try adjusting your search terms.`
                  : 'No documents have been uploaded for this employee yet.'
                }
              </p>
              <div className="mt-6">
                {!searchTerm && (
                  <button
                    onClick={() => setIsDocumentModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Upload First Document
                  </button>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {getFileIcon(doc.file_name)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.file_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doc.file_url.includes('cloudinary') ? 'Cloud Storage' : 'Local Storage'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {doc.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(doc.uploaded_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={doc.file_url}
                            download={doc.file_name}
                            className="text-green-600 hover:text-green-900"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deletingDoc === doc.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete Document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Contract Upload Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Employee Contract
              </h3>
              <button
                onClick={() => {
                  setIsContractModalOpen(false);
                  setContractForm({ start_date: '', end_date: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUploadContract} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleContractFileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={contractForm.start_date}
                  onChange={(e) => setContractForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={contractForm.end_date}
                  onChange={(e) => setContractForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsContractModalOpen(false);
                    setContractForm({ start_date: '', end_date: '', file: null });
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingContract}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {uploadingContract ? 'Uploading...' : 'Upload Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Document
              </h3>
              <button
                onClick={() => {
                  setIsDocumentModalOpen(false);
                  setDocumentForm({ description: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
                  onChange={handleDocumentFileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX, Images, TXT, Excel files
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={documentForm.description}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter document description..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsDocumentModalOpen(false);
                    setDocumentForm({ description: '', file: null });
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDocument}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Termination Letter Upload Modal */}
      {isTerminationModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Termination Letter
              </h3>
              <button
                onClick={() => {
                  setIsTerminationModalOpen(false);
                  setTerminationForm({ termination_date: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> Uploading a termination letter will deactivate this employee.
              </p>
            </div>

            <form onSubmit={handleUploadTermination} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Termination Letter File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleTerminationFileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Termination Date *
                </label>
                <input
                  type="date"
                  value={terminationForm.termination_date}
                  onChange={(e) => setTerminationForm(prev => ({ ...prev, termination_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsTerminationModalOpen(false);
                    setTerminationForm({ termination_date: '', file: null });
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingTermination}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {uploadingTermination ? 'Uploading...' : 'Upload Termination Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warning Letter Upload Modal */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Warning Letter
              </h3>
              <button
                onClick={() => {
                  setIsWarningModalOpen(false);
                  setWarningForm({ warning_date: '', warning_type: '', description: '', file: null });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Warning letters are used to document employee performance issues.
              </p>
            </div>

            <form onSubmit={handleUploadWarning} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warning Letter File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleWarningFileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warning Type *
                </label>
                <select
                  value={warningForm.warning_type}
                  onChange={(e) => setWarningForm(prev => ({ ...prev, warning_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  <option value="">Select warning type</option>
                  <option value="First Warning">First Warning</option>
                  <option value="Second Warning">Second Warning</option>
                  <option value="Final Warning">Final Warning</option>
                  <option value="Verbal Warning">Verbal Warning</option>
                  <option value="Written Warning">Written Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warning Date *
                </label>
                <input
                  type="date"
                  value={warningForm.warning_date}
                  onChange={(e) => setWarningForm(prev => ({ ...prev, warning_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={warningForm.description}
                  onChange={(e) => setWarningForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                  placeholder="Enter warning description..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsWarningModalOpen(false);
                    setWarningForm({ warning_date: '', warning_type: '', description: '', file: null });
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingWarning}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                >
                  {uploadingWarning ? 'Uploading...' : 'Upload Warning Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDocumentsPage; 