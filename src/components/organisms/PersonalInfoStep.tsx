import React from 'react'
import { FormInput } from '../atoms/FormInput'
import { SectionTitle } from '../atoms/SectionTitle'
import { StepNavigation } from '../molecules/StepNavigation'
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card'
import { motion } from 'framer-motion'
import { User, CalendarDays } from 'lucide-react'

interface Props {
  fullName: string
  setFullName: (val: string) => void
  age: string
  setAge: (val: string) => void
  onNext: () => void
}

export const PersonalInfoStep: React.FC<Props> = ({ fullName, setFullName, age, setAge, onNext }) => (
  <div className="max-w-xl mx-auto p-6 sm:p-8">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="rounded-lg shadow-xl border border-primary/20 bg-gradient-to-b from-primary/5 via-background to-primary/5">
        <CardHeader>
          <SectionTitle>
            <User className="inline-block mr-2 h-5 w-5" /> Thông tin cá nhân
          </SectionTitle>
          <p className="text-sm text-muted-foreground">Vui lòng nhập thông tin cơ bản của bạn.</p>
        </CardHeader>
        <CardContent>
          <FormInput label="Họ và tên" value={fullName} onChange={setFullName} icon={<User className="h-4 w-4 text-muted-foreground" />} />
          <FormInput label={"Tuổi"} value={age} onChange={setAge} type="number" icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} />
        </CardContent>
        <CardFooter>
          <StepNavigation onBack={() => {}} onNext={onNext} showBack={false} />
        </CardFooter>
      </Card>
    </motion.div>
  </div>
)
