import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, HardDrive, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';

type StorageType = 'local' | 'aws_s3' | 'wasabi';

interface StorageSettings {
  storageType: StorageType;
  allowedFileTypes: string;
  maxUploadSize: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsDefaultRegion: string;
  awsBucket: string;
  awsUrl: string;
  awsEndpoint: string;
  wasabiAccessKey: string;
  wasabiSecretKey: string;
  wasabiRegion: string;
  wasabiBucket: string;
  wasabiUrl: string;
  wasabiRoot: string;
}

const FILE_EXTENSIONS = [
  '3dmf','3dm','avi','ai','bin','bmp','cab','c','c++','class','css','csv','cdr','doc','dot','docx','dwg','eps','exe','gif','gz','gtar','flv','fh4','fh5','fhc','help','hlp','html','htm','ico','imap','inf','jpe','jpeg','jpg','js','java','latex','log','m3u','midi','mid','mov','mp4','mp3','mpeg','mpg','mp2','ogg','phtml','php','pdf','pgp','png','pps','ppt','ppz','pot','ps','qt','qd3d','qd3','qxd','rar','ra','ram','rm','rtf','spr','sprite','stream','swf','svg','sgml','sgm','tar','tiff','tif','tgz','tex','txt','vob','wav','wrl','xla','xls','xlc','xml','zip','json','webp'
];

interface StorageSettingsProps {
  userSettings?: Record<string, string>;
  auth?: any;
}

export default function StorageSettings({ userSettings, auth }: StorageSettingsProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const canEdit = auth?.user?.permissions?.includes('edit-storage-settings') || 
                  auth?.user?.permissions?.includes('manage-company-settings') ||
                  auth?.user?.permissions?.includes('edit-brand-settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [showR2Guide, setShowR2Guide] = useState(false);
  
  const initializeSettings = (userSettings?: Record<string, string>): StorageSettings => ({
    storageType: (userSettings?.storageType as StorageType) || 'local',
    allowedFileTypes: userSettings?.allowedFileTypes || 'jpg,png,webp,gif',
    maxUploadSize: userSettings?.maxUploadSize || '2048',
    awsAccessKeyId: userSettings?.awsAccessKeyId || '',
    awsSecretAccessKey: userSettings?.awsSecretAccessKey || '',
    awsDefaultRegion: userSettings?.awsDefaultRegion || 'us-east-1',
    awsBucket: userSettings?.awsBucket || '',
    awsUrl: userSettings?.awsUrl || '',
    awsEndpoint: userSettings?.awsEndpoint || '',
    wasabiAccessKey: userSettings?.wasabiAccessKey || '',
    wasabiSecretKey: userSettings?.wasabiSecretKey || '',
    wasabiRegion: userSettings?.wasabiRegion || 'us-east-1',
    wasabiBucket: userSettings?.wasabiBucket || '',
    wasabiUrl: userSettings?.wasabiUrl || '',
    wasabiRoot: userSettings?.wasabiRoot || ''
  });

  const [settings, setSettings] = useState<StorageSettings>(() => initializeSettings(userSettings));

  useEffect(() => {
    if (userSettings) {
      setSettings(initializeSettings(userSettings));
    }
  }, [userSettings]);

  const handleInputChange = (field: keyof StorageSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleFileTypeChange = (extension: string, checked: boolean) => {
    const currentTypes = settings.allowedFileTypes.split(',').filter(type => type.trim());
    const newTypes = checked 
      ? [...currentTypes, extension]
      : currentTypes.filter(type => type !== extension);
    
    setSettings(prev => ({ ...prev, allowedFileTypes: newTypes.join(',') }));
  };

  const handleSelectAll = () => {
    setSettings(prev => ({ ...prev, allowedFileTypes: FILE_EXTENSIONS.join(',') }));
  };

  const handleUnselectAll = () => {
    setSettings(prev => ({ ...prev, allowedFileTypes: '' }));
  };

  const filteredExtensions = useMemo(() => {
    return FILE_EXTENSIONS.filter(ext => 
      ext.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const saveSettings = () => {
    if (!settings.allowedFileTypes.trim()) {
      
      return;
    }

    setIsLoading(true);

    try {
      router.post(route('settings.storage.update'), {
        settings: settings as any
      }, {
        preserveScroll: true,
        onSuccess: () => {
          setIsLoading(false);
          router.reload({ only: ['globalSettings'] });
        },
        onError: () => {
          setIsLoading(false);
        }
      });
    } catch (error) {
      setIsLoading(false);
      
    }
  };

  const renderFileTypeSelector = () => (
    <div className="space-y-2">
      <Label>{t("Allowed File Types")}</Label>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search file types...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {t("Select All")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUnselectAll}
          >
            {t("Unselect All")}
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2 p-4 border rounded-md max-h-48 overflow-y-auto">
          {filteredExtensions.map((ext) => (
            <div key={ext} className="flex gap-2 items-center">
              <Checkbox
                id={ext}
                checked={settings.allowedFileTypes.split(',').includes(ext)}
                onCheckedChange={(checked) => handleFileTypeChange(ext, checked as boolean)}
                disabled={!canEdit}
              />
              <Label htmlFor={ext} className="text-sm font-normal">{ext}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLocalStorageFields = () => (
    <div className="space-y-6">
      {renderFileTypeSelector()}
      
      <div className="space-y-2">
        <Label htmlFor="maxUploadSize">{t("Max Upload Size (KB)")}</Label>
        <Input
          id="maxUploadSize"
          type="number"
          value={settings.maxUploadSize}
          onChange={(e) => handleInputChange('maxUploadSize', e.target.value)}
          placeholder="2048"
          disabled={!canEdit}
        />
      </div>
    </div>
  );

  const renderAwsS3Fields = () => (
    <div className="space-y-6">
      {/* R2 Collapsible Setup Guide */}
      <div className="border border-indigo-150 rounded-lg p-4 bg-indigo-50/20 mb-6">
        <button
          type="button"
          onClick={() => setShowR2Guide(!showR2Guide)}
          className="flex items-center justify-between w-full font-semibold text-indigo-900 text-sm focus:outline-none"
        >
          <span className="flex items-center gap-2">
            📚 Cloudflare R2 Storage Setup Guide (ক্লাউডফ্লেয়ার R2 সেটআপ গাইড)
          </span>
          <span>{showR2Guide ? '▲ Close (বন্ধ করুন)' : '▼ Open (খুলুন)'}</span>
        </button>
        
        {showR2Guide && (
          <div className="mt-4 pt-4 border-t border-indigo-100 space-y-4 text-xs text-indigo-950 leading-relaxed">
            <p>
              Dynime ERP-এর ফাইল স্টোরেজ ক্লাউডফ্লেয়ার R2-তে সিঙ্ক করতে নিচের নির্দেশিকাটি অনুসরণ করুন:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-indigo-200 font-bold">
                    <th className="pb-2 w-1/3">ERP Settings Field</th>
                    <th className="pb-2">Cloudflare R2 Value</th>
                    <th className="pb-2">Format / Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100">
                  <tr>
                    <td className="py-2 font-medium">AWS Access Key ID</td>
                    <td className="py-2">Cloudflare R2 Token Access Key ID</td>
                    <td className="py-2"><code>46ebfc7279cc491d9658d5407702e736</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">AWS Secret Access Key</td>
                    <td className="py-2">Cloudflare R2 Token Secret Access Key</td>
                    <td className="py-2"><code>9658d5407702e736a4f8cf...</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">AWS Default Region</td>
                    <td className="py-2">R2 Default Region (set to auto)</td>
                    <td className="py-2"><code>auto</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">AWS Bucket</td>
                    <td className="py-2">R2 Bucket Name</td>
                    <td className="py-2"><code>dynime</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">AWS URL</td>
                    <td className="py-2">Cloudflare CDN Custom Domain Link</td>
                    <td className="py-2"><strong><code>https://cdn.dynime.com/</code></strong> (অবশ্যই শেষে <code>/</code> থাকতে হবে)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">AWS Endpoint</td>
                    <td className="py-2">Cloudflare R2 S3 API Endpoint URL</td>
                    <td className="py-2"><code>https://&lt;your_account_id&gt;.r2.cloudflarestorage.com</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-100/40 p-3 rounded border border-indigo-200 mt-2">
              <strong className="block text-xs mb-1 font-bold text-indigo-900">⚠️ Cloudflare Bucket CORS Configuration (CORS পলিসি):</strong>
              <p className="mb-2">ইমেজ ও ফাইল সঠিকভাবে ড্যাশবোর্ডে ও ডকুমেন্টে লোড হওয়ার জন্য আপনার Cloudflare R2 বাকেটে নিচের CORS Policy যুক্ত করুন:</p>
              <pre className="bg-white p-2 rounded border text-[10px] font-mono select-all overflow-x-auto text-gray-800">
{`[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "HEAD"],
    "AllowedOrigins": ["https://app.dynime.com", "http://localhost:8000"],
    "ExposeHeaders": []
  }
]`}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="awsAccessKeyId">{t("AWS Access Key ID")}</Label>
          <Input
            id="awsAccessKeyId"
            value={settings.awsAccessKeyId}
            onChange={(e) => handleInputChange('awsAccessKeyId', e.target.value)}
            placeholder="AKIAIOSFODNN7EXAMPLE"
            disabled={!canEdit}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("Enter your Cloudflare R2 Token Access Key ID.")}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awsSecretAccessKey">{t("AWS Secret Access Key")}</Label>
          <Input
            id="awsSecretAccessKey"
            type="password"
            value={settings.awsSecretAccessKey}
            onChange={(e) => handleInputChange('awsSecretAccessKey', e.target.value)}
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            disabled={!canEdit}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("Enter your Cloudflare R2 Token Secret Access Key.")}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awsDefaultRegion">{t("AWS Default Region")}</Label>
          <Input
            id="awsDefaultRegion"
            value={settings.awsDefaultRegion}
            onChange={(e) => handleInputChange('awsDefaultRegion', e.target.value)}
            placeholder="us-east-1"
            disabled={!canEdit}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("Enter region. Set to 'auto' for Cloudflare R2.")}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awsBucket">{t("AWS Bucket")}</Label>
          <Input
            id="awsBucket"
            value={settings.awsBucket}
            onChange={(e) => handleInputChange('awsBucket', e.target.value)}
            placeholder="my-bucket-name"
            disabled={!canEdit}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("Enter the name of your Cloudflare R2 Bucket (e.g. dynime).")}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awsUrl">{t("AWS URL")}</Label>
          <Input
            id="awsUrl"
            value={settings.awsUrl}
            onChange={(e) => handleInputChange('awsUrl', e.target.value)}
            placeholder="https://s3.amazonaws.com"
            disabled={!canEdit}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("Enter custom CDN domain (must end with a slash, e.g. https://cdn.dynime.com/).")}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awsEndpoint">{t("AWS Endpoint")}</Label>
          <Input
            id="awsEndpoint"
            value={settings.awsEndpoint}
            onChange={(e) => handleInputChange('awsEndpoint', e.target.value)}
            placeholder="https://s3.us-east-1.amazonaws.com"
            disabled={!canEdit}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("Enter R2 Endpoint (e.g. https://<account_id>.r2.cloudflarestorage.com).")}
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {renderFileTypeSelector()}
        <div className="space-y-2">
          <Label htmlFor="awsMaxUploadSize">{t("Max Upload Size (KB)")}</Label>
          <Input
            id="awsMaxUploadSize"
            type="number"
            value={settings.maxUploadSize}
            onChange={(e) => handleInputChange('maxUploadSize', e.target.value)}
            placeholder="2048"
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );

  const renderWasabiFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="wasabiAccessKey">{t("Wasabi Access Key")}</Label>
          <Input
            id="wasabiAccessKey"
            value={settings.wasabiAccessKey}
            onChange={(e) => handleInputChange('wasabiAccessKey', e.target.value)}
            placeholder="AKIAIOSFODNN7EXAMPLE"
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wasabiSecretKey">{t("Wasabi Secret Key")}</Label>
          <Input
            id="wasabiSecretKey"
            type="password"
            value={settings.wasabiSecretKey}
            onChange={(e) => handleInputChange('wasabiSecretKey', e.target.value)}
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wasabiRegion">{t("Wasabi Region")}</Label>
          <Input
            id="wasabiRegion"
            value={settings.wasabiRegion}
            onChange={(e) => handleInputChange('wasabiRegion', e.target.value)}
            placeholder="us-east-1"
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wasabiBucket">{t("Wasabi Bucket")}</Label>
          <Input
            id="wasabiBucket"
            value={settings.wasabiBucket}
            onChange={(e) => handleInputChange('wasabiBucket', e.target.value)}
            placeholder="my-wasabi-bucket"
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wasabiUrl">{t("Wasabi URL")}</Label>
          <Input
            id="wasabiUrl"
            value={settings.wasabiUrl}
            onChange={(e) => handleInputChange('wasabiUrl', e.target.value)}
            placeholder="https://s3.wasabisys.com"
            disabled={!canEdit}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wasabiRoot">{t("Wasabi Root")}</Label>
          <Input
            id="wasabiRoot"
            value={settings.wasabiRoot}
            onChange={(e) => handleInputChange('wasabiRoot', e.target.value)}
            placeholder="/"
            disabled={!canEdit}
          />
        </div>
      </div>
      
      <div className="space-y-6">
        {renderFileTypeSelector()}
        <div className="space-y-2">
          <Label htmlFor="wasabiMaxUploadSize">{t("Max Upload Size (KB)")}</Label>
          <Input
            id="wasabiMaxUploadSize"
            type="number"
            value={settings.maxUploadSize}
            onChange={(e) => handleInputChange('maxUploadSize', e.target.value)}
            placeholder="2048"
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5" />
            {t('Storage Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure file storage settings for your application')}
          </p>
        </div>
        {canEdit && (
          <Button className="order-2 rtl:order-1" onClick={saveSettings} disabled={isLoading} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs 
          value={settings.storageType}
          className="w-full"
          onValueChange={(value) => setSettings(prev => ({ ...prev, storageType: value as StorageType }))}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              {t("Local Storage")}
            </TabsTrigger>
            <TabsTrigger value="aws_s3" className="flex items-center gap-2">
              <span>☁️</span>
              {t("AWS S3")}
            </TabsTrigger>
            <TabsTrigger value="wasabi" className="flex items-center gap-2">
              <span>🗄️</span>
              {t("Wasabi")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="local" className="mt-6">
            <h3 className="text-base font-medium mb-4">{t("Local Storage Settings")}</h3>
            {renderLocalStorageFields()}
          </TabsContent>
          
          <TabsContent value="aws_s3" className="mt-6">
            <h3 className="text-base font-medium mb-4">{t("AWS S3 Storage Settings")}</h3>
            {renderAwsS3Fields()}
          </TabsContent>
          
          <TabsContent value="wasabi" className="mt-6">
            <h3 className="text-base font-medium mb-4">{t("Wasabi Storage Settings")}</h3>
            {renderWasabiFields()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}