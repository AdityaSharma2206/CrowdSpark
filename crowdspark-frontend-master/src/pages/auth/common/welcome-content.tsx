function WelcomeContent() {
  return (
    <div className="flex flex-col items-center gap-5">
      <img
        className="w-52 h-40"
        src="https://lh3.googleusercontent.com/d/119OS3gxjMXX-PwXPee7gPGRY6GVeAIIZ=s1000"
      />
      <h1 className="text-5xl text-[#FF6A00] font-bold">CrowdSpark</h1>
      <span className="text-sm text-gray-200">
        The spark of change begins when we give others the power to create.
      </span>
    </div>
  );
}

export default WelcomeContent;
