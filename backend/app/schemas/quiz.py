from pydantic import BaseModel


class QuizQuestionItem(BaseModel):
    id: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str


class QuizGenerateRequest(BaseModel):
    num_questions: int = 5
    force_regenerate: bool = True


class QuizResponse(BaseModel):
    notebook_id: str
    title: str
    questions: list[QuizQuestionItem]

