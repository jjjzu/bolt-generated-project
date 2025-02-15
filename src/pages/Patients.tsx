import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Download, Upload, Save } from 'lucide-react';
import PatientTable from '../components/PatientTable';
import AddPatientModal from '../components/AddPatientModal';
import { patients as initialPatients } from '../data';
import { Patient } from '../types';

interface PatientsProps {
  onPatientClick?: (patient: Patient) => void;
}

export default function Patients({ onPatientClick }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load saved patients when component mounts
  useEffect(() => {
    const savedPatients = localStorage.getItem('patients');
    if (savedPatients) {
      try {
        setPatients(JSON.parse(savedPatients));
      } catch (error) {
        console.error('Error loading saved patients:', error);
        setPatients(initialPatients);
      }
    } else {
      setPatients(initialPatients);
    }
  }, []);

  const handleAddPatient = (newPatient: {
    name: string;
    age: number;
    gender: string;
    condition: string;
    status: 'Stable' | 'Critical' | 'Recovering';
  }) => {
    const patient: Patient = {
      id: (patients.length + 1).toString(),
      name: newPatient.name,
      age: newPatient.age,
      gender: newPatient.gender,
      condition: newPatient.condition,
      status: newPatient.status,
      lastVisit: new Date().toISOString().split('T')[0],
      nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      image: `https://images.unsplash.com/photo-${Math.random().toString().slice(2, 11)}?auto=format&fit=crop&q=80&w=150&h=150`
    };

    const updatedPatients = [...patients, patient];
    setPatients(updatedPatients);
    
    // Automatically save when adding a new patient
    try {
      localStorage.setItem('patients', JSON.stringify(updatedPatients));
    } catch (error) {
      console.error('Error auto-saving after adding patient:', error);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('patients', JSON.stringify(patients));
      alert('Patients data saved successfully!');
    } catch (error) {
      console.error('Error saving patients:', error);
      alert('Error saving patients data. Please try again.');
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Age', 'Gender', 'Condition', 'Status', 'Last Visit', 'Next Appointment'];
    const csvData = patients.map(patient => [
      patient.id,
      patient.name.replace(/;/g, ','), // Replace any semicolons in the data with commas
      patient.age,
      patient.gender.replace(/;/g, ','),
      patient.condition.replace(/;/g, ','),
      patient.status,
      patient.lastVisit,
      patient.nextAppointment
    ]);

    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `patients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(';');

      const importedPatients: Patient[] = lines.slice(1).map((line, index) => {
        const values = line.split(';');
        return {
          id: values[0] || (patients.length + index + 1).toString(),
          name: values[1],
          age: parseInt(values[2], 10),
          gender: values[3],
          condition: values[4],
          status: values[5] as 'Stable' | 'Critical' | 'Recovering',
          lastVisit: values[6],
          nextAppointment: values[7],
          image: `https://images.unsplash.com/photo-${Math.random().toString().slice(2, 11)}?auto=format&fit=crop&q=80&w=150&h=150`
        };
      });

      const updatedPatients = [...patients, ...importedPatients];
      setPatients(updatedPatients);
      
      // Auto-save after import
      try {
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
      } catch (error) {
        console.error('Error auto-saving after import:', error);
      }
      
      // Reset the input
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Patients</h1>
            <p className="text-secondary-600">Manage and view patient records</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-secondary-600 hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </label>
            </div>
            <button 
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-secondary-600 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button 
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-secondary-600 hover:bg-gray-50"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Patients', value: patients.length, trend: '+12% from last month' },
            { label: 'New Patients', value: '89', trend: '+7% from last month' },
            { label: 'Critical Cases', value: patients.filter(p => p.status === 'Critical').length, trend: '-3% from last month' },
            { label: 'Scheduled Today', value: '42', trend: 'Same as yesterday' }
          ].map(({ label, value, trend }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-secondary-600">{label}</p>
              <p className="text-2xl font-semibold text-secondary-900 mt-1">{value}</p>
              <p className="text-xs text-secondary-500 mt-1">{trend}</p>
            </div>
          ))}
        </div>

        <PatientTable patients={patients} onPatientClick={onPatientClick} />

        <AddPatientModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPatient}
        />
      </div>
    </div>
  );
}
