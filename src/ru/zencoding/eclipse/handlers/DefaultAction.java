package ru.zencoding.eclipse.handlers;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;

public class DefaultAction extends AbstractHandler {
	
	@Override
	public Object execute(ExecutionEvent event) throws ExecutionException {
		// ru.zencoding.eclipse.commands.matchPairCommand
		String commandId = event.getCommand().getId();
		String commandName = commandId.substring(commandId.lastIndexOf('.') + 1);
		ActionRunner.getSingleton().run(commandName);
		return null;
	}

}
