import { FormInput } from '../atoms/FormInput';
import { SectionTitle } from '../atoms/SectionTitle';

interface Props {
  fullName: string;
  setFullName: (val: string) => void;
  age: string;
  setAge: (val: string) => void;
}

export const PersonalInfoStep: React.FC<Props> = ({ fullName, setFullName, age, setAge }) => (
  <div>
    <SectionTitle>Thông tin cá nhân</SectionTitle>
    <FormInput label="Họ và tên" value={fullName} onChange={setFullName} />
    <FormInput label="Tuổi" value={age} onChange={setAge} type="number" />
  </div>
);
