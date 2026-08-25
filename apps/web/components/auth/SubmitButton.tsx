import { FC } from "react"

interface IProps {
    isLoading: boolean,
    loadingText: string,
    text: string,
}

export const SubmitButton: FC<IProps> = ({ isLoading, loadingText, text }) => (
    <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
        {isLoading ? loadingText : text}
    </button>
)