package ru.zencoding.eclipse.handlers;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;

public class DefaultAction extends AbstractHandler {
	
	@Override
	public Object execute(ExecutionEvent event) throws ExecutionException {
		// ru.zencoding.eclipse.commands.matchPairCommand
		System.out.println(event.getCommand().getId());
		ActionRunner.getSingleton().run("match_pair_outward");
		return null;
	}

}
