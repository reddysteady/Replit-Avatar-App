This spec is for enhancements to the AI onboarding flow and will allow the user to have further discussion with the AI to capture further data. 

I'm thinking of this implementation approach:
After the 4th message of the AI onboarding flow, and once tone is captured: The AI will start generating responses that blend the extracted persona with the guidance questions:
Visual feedback: Users will see a "🎭 Persona Preview" badge when the AI is speaking in their configured voice
Dual response: The response combines both the persona-aware reply and the continued guidance questions
Progressive enhancement: The persona gets stronger as more data is collected
Once the AI has completed its objectives it should say something like (can be adjusted based on the Persona adopted) "I've now captured enough information for your persona, if you'd like to keep chatting with me you can see how I'll respond and further fine-tune the persona"
The AI should continue to ask questions to gather further information to further flesh out the persona. What questions could it ask to improve the level of detail in Tone and Style and for the other parameters?