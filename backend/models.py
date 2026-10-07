from pydantic import BaseModel, Field

class StudentProfile(BaseModel):
    fullName: str = Field(...)
    academicYear: str = Field(...)
    familyIncome: str = Field(...)
    category: str = Field(...)
    careerInterest: str = Field(...)