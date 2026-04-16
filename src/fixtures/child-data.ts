export interface ChildProfileData {
  childName: string;
  childBornCity: string;
  childBornDistrict: string;
  childId: string;
  childResidenceCity: string;
  childResidenceDistrict: string;
  childBirthDate: string;
  childGender: '男' | '女';
  over37Weeks: '是' | '否';
  dueDate?: string;
  birthWeight: '<2500g' | '≥2500g';
  isIndigenous: '是' | '否';
  indigenousType?: string;
  sameResidence: boolean;
}

const runId = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(-8);

export const defaultChildProfile: ChildProfileData = {
  childName: `PW孩童${runId}`,
  childBornCity: '臺北市',
  childBornDistrict: '中正區',
  childId: `F1${runId.slice(0, 8)}`.slice(0, 10),
  childResidenceCity: '臺北市',
  childResidenceDistrict: '中正區',
  childBirthDate: '2024-01-01',
  childGender: '女',
  over37Weeks: '否',
  dueDate: '2024-01-31',
  birthWeight: '<2500g',
  isIndigenous: '否',
  sameResidence: true
};
