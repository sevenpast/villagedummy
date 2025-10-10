'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Eye, Trash2, ArrowLeft, User, MapPin, Users, FileText, Calendar, Shield } from 'lucide-react';

export default function MyDataPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }

    // Load user documents
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const userId = user?.id || 'default';
      const response = await fetch(`/api/documents/load?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    if (!user) return;

    const exportData = {
      personalInformation: {
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        gender: user.gender,
        nationality: user.nationality,
        birth_place: user.birth_place,
        german_skills: user.german_skills,
        first_language: user.first_language,
        family_language: user.family_language,
      },
      countryInformation: {
        country_of_origin: user.country_of_origin,
        is_eu_efta_citizen: user.is_eu_efta_citizen,
      },
      familyInformation: {
        has_kids: user.has_kids,
        num_children: user.num_children,
        parent_role: user.parent_role,
      },
      locationInformation: {
        municipality: user.municipality,
        canton: user.canton,
        postal_code: user.postal_code,
      },
      documents: documents.map(doc => ({
        filename: doc.filename,
        document_type: doc.document_type,
        uploaded_at: doc.uploaded_at,
        file_size: doc.file_size,
        tags: doc.tags,
        description: doc.description,
      })),
      systemInformation: {
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        profile_completeness: user.profile_completeness,
      },
      exportDate: new Date().toISOString(),
      dataSubject: "Personal Data Export - DSGVO Article 20"
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const requestDataDeletion = () => {
    if (confirm('Are you sure you want to request deletion of all your data? This action cannot be undone.')) {
      // In a real application, this would send a request to the backend
      alert('Data deletion request submitted. You will receive a confirmation email within 30 days.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your data.</p>
          <button 
            onClick={() => router.push('/signin')}
            className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meine Daten</h1>
                <p className="text-sm text-gray-600">DSGVO-konforme Datenübersicht</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Daten exportieren
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* DSGVO Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">DSGVO-Rechte</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Sie haben das Recht, Ihre personenbezogenen Daten einzusehen, zu korrigieren, zu löschen oder zu exportieren. 
                  Diese Übersicht zeigt alle Daten, die wir über Sie speichern.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Persönliche Informationen</h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Benutzername</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.username || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Vorname</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.first_name || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nachname</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.last_name || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Geschlecht</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.gender || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nationalität</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.nationality || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Geburtsort</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.birth_place || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Deutschkenntnisse</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.german_skills || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Muttersprache</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.first_language || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Familiensprache</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.family_language || 'Nicht angegeben'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Country Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Länderinformationen</h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Herkunftsland</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.country_of_origin || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">EU/EFTA-Bürger</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.is_eu_efta_citizen ? 'Ja' : user.is_eu_efta_citizen === false ? 'Nein' : 'Nicht bestimmt'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Family Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Familieninformationen</h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Hat Kinder</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.has_kids ? 'Ja' : 'Nein'}</dd>
                  </div>
                  {user.has_kids && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Anzahl Kinder</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.num_children || 'Nicht angegeben'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Elternrolle</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.parent_role || 'Nicht angegeben'}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Standort in der Schweiz</h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kanton</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.canton || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Postleitzahl</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.postal_code || 'Nicht angegeben'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gemeinde</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.municipality || 'Nicht angegeben'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Hochgeladene Dokumente</h2>
                </div>
              </div>
              <div className="px-6 py-4">
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                            <p className="text-xs text-gray-500">
                              {doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Keine Dokumente hochgeladen</p>
                )}
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <h2 className="text-lg font-medium text-gray-900">Systeminformationen</h2>
                </div>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Account erstellt</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'Nicht verfügbar'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Letzte Aktualisierung</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('de-DE') : 'Nicht verfügbar'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Profilvollständigkeit</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.profile_completeness?.completeness_percentage || 0}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Data Management Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Datenverwaltung</h2>
              </div>
              <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={exportData}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Alle Daten exportieren
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profil bearbeiten
                  </button>
                  <button
                    onClick={requestDataDeletion}
                    className="flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Daten löschen beantragen
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
